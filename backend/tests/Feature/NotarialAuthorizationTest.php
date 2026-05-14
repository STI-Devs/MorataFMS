<?php

use App\Models\LegalArchiveRecord;
use App\Models\LegalParty;
use App\Models\NotarialBook;
use App\Models\NotarialGeneratedDocument;
use App\Models\NotarialLegacyFile;
use App\Models\NotarialPageScan;
use App\Models\NotarialTemplate;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;

test('admin can create a book archive without sending workflow mode', function () {
    $user = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($user)
        ->postJson('/api/notarial/books', [
            'book_number' => 1,
            'year' => 2026,
            'status' => 'active',
        ])
        ->assertCreated()
        ->assertJsonPath('data.book_number', 1);
});

test('paralegal cannot create a book archive', function () {
    $paralegal = User::factory()->create([
        'role' => 'paralegal',
    ]);

    $this->actingAs($paralegal)
        ->postJson('/api/notarial/books', [
            'book_number' => 2,
            'year' => 2026,
        ])
        ->assertForbidden();
});

test('admin cannot create a second active book archive', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    makeBook([
        'book_number' => 1,
        'year' => 2026,
        'status' => 'active',
        'opened_at' => now(),
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->postJson('/api/notarial/books', [
            'book_number' => 2,
            'year' => 2026,
            'status' => 'active',
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'There is already an active book (Book 1, 2026). Archive or close it first.');
});

test('legal users can browse the notarial catalog', function () {
    $paralegal = User::factory()->create([
        'role' => 'paralegal',
    ]);

    $this->actingAs($paralegal)
        ->getJson('/api/notarial/document-types')
        ->assertOk()
        ->assertJsonPath('categories.0.code', 'affidavit_oath')
        ->assertJsonPath('document_types.0.code', 'AFFIDAVIT_GENERAL');
});

test('legal users can browse the legal document workflow catalog', function () {
    $paralegal = User::factory()->create([
        'role' => 'paralegal',
    ]);

    $response = $this->actingAs($paralegal)
        ->getJson('/api/legal/document-types')
        ->assertOk()
        ->assertJsonPath('categories.0.code', 'intern_records');

    expect(collect($response->json('document_types'))->pluck('code')->all())
        ->toContain('CERTIFICATE_OF_COMPLETION_INTERNS', 'DEMAND_LETTER');
});

test('admin can create a notarial template with a docx master file', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/api/notarial/templates', [
            'code' => 'affidavit-loss-master',
            'label' => 'Affidavit of Loss',
            'document_code' => 'AFFIDAVIT_LOSS',
            'file' => fakeDocxUpload('affidavit-of-loss.docx', [
                'Affidavit of Loss',
                'Editable content is handled directly in ONLYOFFICE.',
            ]),
        ])
        ->assertCreated()
        ->assertJsonPath('data.code', 'affidavit-loss-master')
        ->assertJsonPath('data.template_status', 'ready');

    expect(NotarialTemplate::query()->where('code', 'affidavit-loss-master')->exists())->toBeTrue();
});

test('admin can create a legal document master with a docx source file', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/api/legal/templates', [
            'code' => 'demand-letter-standard',
            'label' => 'Demand Letter Standard',
            'document_code' => 'DEMAND_LETTER',
            'file' => fakeDocxUpload('demand-letter.docx', [
                'Demand Letter',
                'Editable content is handled directly in ONLYOFFICE.',
            ]),
        ])
        ->assertCreated()
        ->assertJsonPath('data.module', 'legal')
        ->assertJsonPath('data.code', 'demand-letter-standard')
        ->assertJsonPath('data.document_code_label', 'Demand Letter')
        ->assertJsonPath('data.document_category', 'case_documents')
        ->assertJsonPath('data.template_status', 'ready');

    $template = NotarialTemplate::query()
        ->where('module', 'legal')
        ->where('code', 'demand-letter-standard')
        ->firstOrFail();

    expect($template->path)->toStartWith('legal-templates/demand-letter/');
});

test('paralegal can create a notarial template with a docx master file', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $this->actingAs($paralegal)
        ->post('/api/notarial/templates', [
            'code' => 'affidavit-support-master',
            'label' => 'Affidavit of Support',
            'document_code' => 'AFFIDAVIT_SUPPORT',
            'file' => fakeDocxUpload('affidavit-of-support.docx', [
                'Affidavit of Support',
                'Editable content is handled directly in ONLYOFFICE.',
            ]),
        ])
        ->assertCreated()
        ->assertJsonPath('data.code', 'affidavit-support-master')
        ->assertJsonPath('data.created_by.name', $paralegal->name);
});

test('notarial template uploads are exempt from the generic request size cap', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/api/notarial/templates', [
            'code' => 'affidavit-support-master',
            'label' => 'Affidavit of Support',
            'document_code' => 'AFFIDAVIT_SUPPORT',
            'file' => UploadedFile::fake()->create(
                'affidavit-of-support.docx',
                128,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ),
        ])
        ->assertCreated()
        ->assertJsonPath('data.code', 'affidavit-support-master');
});

test('paralegal can create an editable generated document and sync the legal party directory', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $paralegal = User::factory()->create(['role' => 'paralegal']);

    /** @var UploadedFile $templateFile */
    $templateFile = fakeDocxUpload('affidavit-of-loss.docx', [
        'Affidavit of Loss',
        'Staff edits this document directly in ONLYOFFICE.',
    ]);

    $party = LegalParty::query()->create([
        'name' => 'Maria Santos',
        'principal_address' => 'Old Address',
    ]);

    $templateResponse = $this->actingAs($admin)->post('/api/notarial/templates', [
        'code' => 'affidavit-loss-master',
        'label' => 'Affidavit of Loss',
        'document_code' => 'AFFIDAVIT_LOSS',
        'file' => $templateFile,
    ]);

    $templateResponse->assertCreated();
    $templateId = $templateResponse->json('data.id');

    $response = $this->actingAs($paralegal)
        ->postJson('/api/notarial/generated-documents', [
            'notarial_template_id' => $templateId,
            'party_name' => 'Maria Santos',
            'party_id' => $party->id,
            'notes' => 'Editable copy created by the assistant.',
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.party_name', 'Maria Santos')
        ->assertJsonPath('data.generated_file.mime_type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        ->assertJsonPath('data.party.id', $party->id);

    $response->assertJsonMissingPath('data.notarial_act_type');

    expect(NotarialGeneratedDocument::query()->count())->toBe(1);
    expect(NotarialGeneratedDocument::query()->firstOrFail()->legal_party_id)->toBe($party->id);
    expect(LegalParty::query()->where('name', 'Maria Santos')->value('principal_address'))->toBe('Old Address');
    Storage::disk(config('filesystems.default', 'local'))->assertExists(NotarialGeneratedDocument::query()->firstOrFail()->path);
});

test('paralegal can create a legal editable generated document from a legal master', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $diskName = config('filesystems.default', 'local');
    $sourcePath = 'legal-templates/demand_letter/master.docx';
    Storage::disk($diskName)->put($sourcePath, 'legal master body');

    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $template = NotarialTemplate::query()->forceCreate([
        'module' => 'legal',
        'code' => 'demand-letter-editor',
        'label' => 'Demand Letter',
        'document_code' => 'DEMAND_LETTER',
        'document_category' => 'case_documents',
        'default_notarial_act_type' => 'acknowledgment',
        'is_active' => true,
        'filename' => 'master.docx',
        'path' => $sourcePath,
        'disk' => $diskName,
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => strlen('legal master body'),
        'created_by' => $paralegal->id,
    ]);

    $response = $this->actingAs($paralegal)
        ->postJson('/api/legal/generated-documents', [
            'notarial_template_id' => $template->id,
            'party_name' => 'Northpoint Trading Corporation',
            'notes' => 'Legal draft created from a DOCX master.',
        ])
        ->assertCreated()
        ->assertJsonPath('data.module', 'legal')
        ->assertJsonPath('data.template_code', 'demand-letter-editor')
        ->assertJsonPath('data.document_code_label', 'Demand Letter')
        ->assertJsonPath('data.document_category_label', 'Case Documents')
        ->assertJsonPath('data.party_name', 'Northpoint Trading Corporation');

    $record = NotarialGeneratedDocument::query()->findOrFail($response->json('data.id'));

    expect($record->path)->toStartWith('legal-generated/');
    expect(Storage::disk($diskName)->get($record->path))->toBe('legal master body');
    expect(LegalParty::query()->where('name', 'Northpoint Trading Corporation')->exists())->toBeTrue();
});

test('legal and notarial document workflow routes are isolated by module', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $notarialRecord = makeGeneratedDocument($admin, 'notarial body');
    $legalRecord = makeLegalGeneratedDocument($admin, 'legal body');

    $this->actingAs($admin)
        ->getJson("/api/legal/generated-documents/{$notarialRecord->id}")
        ->assertNotFound();

    $this->actingAs($admin)
        ->getJson("/api/notarial/generated-documents/{$legalRecord->id}")
        ->assertNotFound();
});

test('inactive notarial templates cannot be used for editable copies', function () {
    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $template = NotarialTemplate::query()->forceCreate([
        'code' => 'inactive-master',
        'label' => 'Inactive Master',
        'document_code' => 'AFFIDAVIT_GENERAL',
        'document_category' => 'affidavit_oath',
        'default_notarial_act_type' => 'jurat',
        'is_active' => false,
        'created_by' => $paralegal->id,
    ]);

    $this->actingAs($paralegal)
        ->postJson('/api/notarial/generated-documents', [
            'notarial_template_id' => $template->id,
            'party_name' => 'Juan Dela Cruz',
        ])
        ->assertStatus(422)
        ->assertJsonPath('message', 'This document master is inactive and cannot be edited.');
});

test('generated documents can be filtered by category and document master', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $template = NotarialTemplate::query()->forceCreate([
        'code' => 'spa-master',
        'label' => 'Special Power of Attorney',
        'document_code' => 'SPECIAL_POWER_OF_ATTORNEY',
        'document_category' => 'power_of_attorney',
        'default_notarial_act_type' => 'acknowledgment',
        'is_active' => true,
        'filename' => 'spa-master.docx',
        'path' => 'notarial-templates/power_of_attorney/spa-master.docx',
        'disk' => config('filesystems.default', 'local'),
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => 100,
        'created_by' => $admin->id,
    ]);

    NotarialGeneratedDocument::query()->forceCreate([
        'notarial_template_id' => $template->id,
        'template_code' => $template->code,
        'template_label' => $template->label,
        'document_code' => $template->document_code,
        'document_category' => $template->document_category,
        'notarial_act_type' => $template->default_notarial_act_type,
        'party_name' => 'Northpoint Trading Corporation',
        'filename' => 'northpoint-spa.docx',
        'path' => 'notarial-generated/2026/spa-master/northpoint-spa.docx',
        'disk' => config('filesystems.default', 'local'),
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => 100,
        'created_by' => $paralegal->id,
        'generated_at' => now(),
    ]);

    $this->actingAs($paralegal)
        ->getJson("/api/notarial/generated-documents?document_category=power_of_attorney&notarial_template_id={$template->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.template_code', 'spa-master')
        ->assertJsonMissingPath('data.0.notarial_act_type');
});

test('admin can delete a generated document record and its stored docx file', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $record = makeGeneratedDocument($admin, 'generated body');

    $this->actingAs($admin)
        ->deleteJson("/api/notarial/generated-documents/{$record->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Generated document deleted.');

    Storage::disk(config('filesystems.default', 'local'))->assertMissing($record->path);
    expect($record->fresh())->toBeNull();
});

test('paralegal cannot delete generated document records', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $record = makeGeneratedDocument($admin, 'generated body');

    $this->actingAs($paralegal)
        ->deleteJson("/api/notarial/generated-documents/{$record->id}")
        ->assertForbidden();

    Storage::disk(config('filesystems.default', 'local'))->assertExists($record->path);
    expect($record->fresh())->not->toBeNull();
});

test('admin can delete a document master when no generated documents use it', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $path = 'notarial-templates/affidavit_general/deletable-master.docx';
    Storage::disk(config('filesystems.default', 'local'))->put($path, 'template body');

    $template = NotarialTemplate::query()->forceCreate([
        'code' => 'deletable-master',
        'label' => 'Deletable Master',
        'document_code' => 'AFFIDAVIT_GENERAL',
        'document_category' => 'affidavit_oath',
        'default_notarial_act_type' => 'jurat',
        'is_active' => true,
        'filename' => 'deletable-master.docx',
        'path' => $path,
        'disk' => config('filesystems.default', 'local'),
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => strlen('template body'),
        'created_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->deleteJson("/api/notarial/templates/{$template->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Template deleted.');

    Storage::disk(config('filesystems.default', 'local'))->assertMissing($path);
    expect($template->fresh())->toBeNull();
});

test('admin cannot delete a document master that already has generated records', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $record = makeGeneratedDocument($admin, 'generated body');
    $template = $record->template;
    $templatePath = 'notarial-templates/affidavit_general/in-use-master.docx';
    Storage::disk(config('filesystems.default', 'local'))->put($templatePath, 'template body');
    $template->forceFill([
        'path' => $templatePath,
        'disk' => config('filesystems.default', 'local'),
    ])->save();

    $this->actingAs($admin)
        ->deleteJson("/api/notarial/templates/{$template->id}")
        ->assertStatus(409)
        ->assertJsonPath('message', 'Generated records already exist for this template. Archive it instead of deleting.');

    Storage::disk(config('filesystems.default', 'local'))->assertExists($templatePath);
    expect($template->fresh())->not->toBeNull();
});

test('paralegal can upload page-indexed scans for any archived book', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $book = makeBook([
        'book_number' => 8,
        'year' => 2026,
        'status' => 'archived',
        'opened_at' => now(),
        'closed_at' => now(),
        'created_by' => $admin->id,
    ]);

    $this->actingAs($paralegal)->post(
        "/api/notarial/books/{$book->id}/page-scans",
        [
            'page_start' => 1,
            'page_end' => 50,
            'file' => UploadedFile::fake()->create('book8-pages-1-50.pdf', 1024, 'application/pdf'),
        ],
    )
        ->assertCreated()
        ->assertJsonPath('data.page_range_label', 'Pages 1–50');

    expect(NotarialPageScan::query()->count())->toBe(1);
});

test('paralegal can upload legacy book files for any archived book', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $book = makeBook([
        'book_number' => 10,
        'year' => 2025,
        'status' => 'archived',
        'opened_at' => now(),
        'closed_at' => now(),
        'created_by' => $admin->id,
    ]);

    $this->actingAs($paralegal)->post(
        "/api/notarial/books/{$book->id}/legacy-files",
        [
            'files' => [
                UploadedFile::fake()->create('book10-scan-1.pdf', 1024, 'application/pdf'),
                UploadedFile::fake()->create('book10-scan-2.pdf', 1024, 'application/pdf'),
            ],
        ],
    )
        ->assertCreated()
        ->assertJsonCount(2, 'data');

    expect(NotarialLegacyFile::query()->count())->toBe(2);
});

test('notarial template downloads preserve the stored filename', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $path = 'notarial-templates/affidavit_general/master-template.docx';
    Storage::disk(config('filesystems.default', 'local'))->put($path, 'template body');

    $template = NotarialTemplate::query()->forceCreate([
        'code' => 'download-master',
        'label' => 'Download Master',
        'document_code' => 'AFFIDAVIT_GENERAL',
        'document_category' => 'affidavit_oath',
        'default_notarial_act_type' => 'jurat',
        'is_active' => true,
        'filename' => 'Affidavit Master.docx',
        'path' => $path,
        'disk' => config('filesystems.default', 'local'),
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => 13,
        'created_by' => $paralegal->id,
    ]);

    $response = $this->actingAs($paralegal)
        ->get("/api/notarial/templates/{$template->id}/download")
        ->assertOk();

    expect((string) $response->headers->get('content-disposition'))->toContain('Affidavit Master.docx');
    expect((string) $response->headers->get('content-type'))
        ->toContain('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
});

test('admin can create a docx document master without placeholder fields', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);

    /** @var UploadedFile $templateFile */
    $templateFile = fakeDocxUpload('affidavit-of-loss.docx', [
        'Affidavit of Loss',
        'Editable content will be handled in ONLYOFFICE.',
    ]);

    $this->actingAs($admin)
        ->post('/api/notarial/templates', [
            'code' => 'affidavit-loss-editor-master',
            'label' => 'Affidavit of Loss Editor Master',
            'document_code' => 'AFFIDAVIT_LOSS',
            'file' => $templateFile,
        ])
        ->assertCreated()
        ->assertJsonPath('data.template_status', 'ready');
});

test('paralegal can create an editable generated document from a document master', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $diskName = config('filesystems.default', 'local');
    $sourcePath = 'notarial-templates/affidavit_loss/master.docx';
    Storage::disk($diskName)->put($sourcePath, 'master docx body');

    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $template = NotarialTemplate::query()->forceCreate([
        'code' => 'affidavit-loss-editor',
        'label' => 'Affidavit of Loss',
        'document_code' => 'AFFIDAVIT_LOSS',
        'document_category' => 'affidavit_oath',
        'default_notarial_act_type' => 'jurat',
        'is_active' => true,
        'filename' => 'master.docx',
        'path' => $sourcePath,
        'disk' => $diskName,
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => strlen('master docx body'),
        'created_by' => $paralegal->id,
    ]);

    $response = $this->actingAs($paralegal)
        ->postJson('/api/notarial/generated-documents', [
            'notarial_template_id' => $template->id,
            'party_name' => 'Juan Dela Cruz',
            'notes' => 'Client will edit this directly.',
        ])
        ->assertCreated()
        ->assertJsonPath('data.template_code', 'affidavit-loss-editor')
        ->assertJsonPath('data.party_name', 'Juan Dela Cruz');

    $record = NotarialGeneratedDocument::query()->findOrFail($response->json('data.id'));

    expect(Storage::disk($diskName)->get($record->path))->toBe('master docx body');
    expect(LegalParty::query()->where('name', 'Juan Dela Cruz')->exists())->toBeTrue();
});

test('legal users can get onlyoffice editor config for generated documents', function () {
    Storage::fake(config('filesystems.default', 'local'));
    config()->set('services.onlyoffice.document_server_url', 'http://onlyoffice.test');
    config()->set('services.onlyoffice.internal_app_url', 'http://app-from-document-server.test');
    config()->set('services.onlyoffice.jwt_secret', 'test-secret');

    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $record = makeGeneratedDocument($paralegal, 'original body');

    $this->actingAs($paralegal)
        ->getJson("/api/notarial/generated-documents/{$record->id}/onlyoffice/config")
        ->assertOk()
        ->assertJsonPath('document_server_url', 'http://onlyoffice.test')
        ->assertJsonPath('config.document.fileType', 'docx')
        ->assertJsonPath('config.document.url', fn (string $url): bool => str_starts_with($url, 'http://app-from-document-server.test/api/notarial/generated-documents/'))
        ->assertJsonPath('config.editorConfig.mode', 'edit')
        ->assertJsonStructure([
            'config' => [
                'document' => ['url'],
                'editorConfig' => ['callbackUrl'],
                'token',
            ],
        ]);
});

test('legal users can get onlyoffice editor config for legal generated documents', function () {
    Storage::fake(config('filesystems.default', 'local'));
    config()->set('services.onlyoffice.document_server_url', 'http://onlyoffice.test');
    config()->set('services.onlyoffice.internal_app_url', 'http://app-from-document-server.test');
    config()->set('services.onlyoffice.jwt_secret', 'test-secret');

    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $record = makeLegalGeneratedDocument($paralegal, 'legal body');

    $this->actingAs($paralegal)
        ->getJson("/api/legal/generated-documents/{$record->id}/onlyoffice/config")
        ->assertOk()
        ->assertJsonPath('document_server_url', 'http://onlyoffice.test')
        ->assertJsonPath('config.document.fileType', 'docx')
        ->assertJsonPath('config.editorConfig.mode', 'edit')
        ->assertJsonPath('config.document.url', fn (string $url): bool => str_starts_with($url, 'http://app-from-document-server.test/api/notarial/generated-documents/'));
});

test('legal users can view a generated document storage status record', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $record = makeGeneratedDocument($paralegal, 'original body');

    $this->actingAs($paralegal)
        ->getJson("/api/notarial/generated-documents/{$record->id}")
        ->assertOk()
        ->assertJsonPath('data.id', $record->id)
        ->assertJsonPath('data.party_name', 'Maria Santos')
        ->assertJsonPath('data.generated_file.filename', 'maria-affidavit.docx')
        ->assertJsonPath('data.generated_file.formatted_size', '13 B');
});

test('legal users can preview generated document files from storage', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $docxUpload = fakeDocxUpload('maria-affidavit.docx', [
        'AFFIDAVIT OF LOSS',
        'Maria Santos stored preview text.',
    ]);
    $docxContents = file_get_contents($docxUpload->getRealPath());

    $record = makeGeneratedDocument($paralegal, (string) $docxContents);

    $this->actingAs($paralegal)
        ->get("/api/notarial/generated-documents/{$record->id}/preview")
        ->assertOk()
        ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        ->assertHeader('content-disposition', 'inline; filename="maria-affidavit.docx"');
});

test('onlyoffice callback saves the edited generated document file through a signed route', function () {
    Storage::fake(config('filesystems.default', 'local'));
    config()->set('services.onlyoffice.document_server_url', 'http://onlyoffice.test');

    Http::fake([
        'http://onlyoffice.test/edited.docx' => Http::response('edited body', 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ]),
    ]);

    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $record = makeGeneratedDocument($paralegal, 'original body');

    $callbackUrl = URL::temporarySignedRoute(
        'notarial.generated-documents.onlyoffice-callback',
        now()->addHour(),
        ['document' => $record],
        false,
    );

    $this->postJson($callbackUrl, [
        'status' => 6,
        'url' => 'http://onlyoffice.test/edited.docx',
    ])->assertOk()
        ->assertJsonPath('error', 0);

    Storage::disk(config('filesystems.default', 'local'))->assertExists($record->path);
    expect(Storage::disk(config('filesystems.default', 'local'))->get($record->path))->toBe('edited body');
    expect($record->fresh()->size_bytes)->toBe(strlen('edited body'));
});

test('onlyoffice callback rejects edited file urls outside the configured document server', function () {
    Storage::fake(config('filesystems.default', 'local'));
    config()->set('services.onlyoffice.document_server_url', 'https://onlyoffice.test');
    Http::fake();

    $paralegal = User::factory()->create(['role' => 'paralegal']);
    $record = makeGeneratedDocument($paralegal, 'original body');

    $callbackUrl = URL::temporarySignedRoute(
        'notarial.generated-documents.onlyoffice-callback',
        now()->addHour(),
        ['document' => $record],
        false,
    );

    $this->postJson($callbackUrl, [
        'status' => 6,
        'url' => 'http://169.254.169.254/latest/meta-data',
    ])->assertOk()
        ->assertJsonPath('error', 1);

    Http::assertNothingSent();
    expect(Storage::disk(config('filesystems.default', 'local'))->get($record->path))->toBe('original body');
});

test('legal archive download returns 404 when the stored file is missing', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $record = new LegalArchiveRecord([
        'file_category' => 'intern_records',
        'file_code' => 'CERTIFICATE_OF_COMPLETION_INTERNS',
        'title' => 'Corporate registration',
        'related_name' => 'Northpoint Trading Corporation',
        'filename' => 'missing.pdf',
        'path' => 'legal-archive/2026/corporate-records/missing.pdf',
        'disk' => config('filesystems.default', 'local'),
        'mime_type' => 'application/pdf',
        'size_bytes' => 100,
    ]);
    $record->created_by = $paralegal->id;
    $record->save();

    $this->actingAs($paralegal)
        ->getJson("/api/legal-archive/{$record->id}/download")
        ->assertNotFound()
        ->assertJsonPath('message', 'File not found on storage.');
});

/**
 * @param  list<string>  $lines
 */
function fakeDocxUpload(string $filename, array $lines): UploadedFile
{
    $phpWord = new PhpWord;
    $section = $phpWord->addSection();

    foreach ($lines as $line) {
        $section->addText($line);
    }

    $temporaryPath = tempnam(sys_get_temp_dir(), 'morata_test_');
    if ($temporaryPath === false) {
        throw new RuntimeException('Unable to create a temporary DOCX test file.');
    }

    $targetPath = $temporaryPath.'.docx';
    rename($temporaryPath, $targetPath);

    IOFactory::createWriter($phpWord, 'Word2007')->save($targetPath);

    return new UploadedFile(
        $targetPath,
        $filename,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        null,
        true,
    );
}

/**
 * @param  array<string, mixed>  $attributes
 */
function makeBook(array $attributes): NotarialBook
{
    $book = (new NotarialBook)->forceFill($attributes);
    $book->status = (string) ($attributes['status'] ?? 'archived');
    $book->opened_at = $attributes['opened_at'] ?? null;
    $book->closed_at = $attributes['closed_at'] ?? null;
    $book->created_by = (int) $attributes['created_by'];
    $book->save();

    return $book;
}

function makeGeneratedDocument(User $user, string $contents): NotarialGeneratedDocument
{
    $path = 'notarial-generated/2026/test-record.docx';
    Storage::disk(config('filesystems.default', 'local'))->put($path, $contents);

    $template = NotarialTemplate::query()->forceCreate([
        'code' => 'editor-master',
        'label' => 'Editor Master',
        'document_code' => 'AFFIDAVIT_GENERAL',
        'document_category' => 'affidavit_oath',
        'default_notarial_act_type' => 'jurat',
        'is_active' => true,
        'created_by' => $user->id,
    ]);

    return NotarialGeneratedDocument::query()->forceCreate([
        'notarial_template_id' => $template->id,
        'template_code' => $template->code,
        'template_label' => $template->label,
        'document_code' => $template->document_code,
        'document_category' => $template->document_category,
        'notarial_act_type' => $template->default_notarial_act_type,
        'party_name' => 'Maria Santos',
        'filename' => 'maria-affidavit.docx',
        'path' => $path,
        'disk' => config('filesystems.default', 'local'),
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => strlen($contents),
        'created_by' => $user->id,
        'generated_at' => now(),
    ]);
}

function makeLegalGeneratedDocument(User $user, string $contents): NotarialGeneratedDocument
{
    $path = 'legal-generated/2026/test-record.docx';
    Storage::disk(config('filesystems.default', 'local'))->put($path, $contents);

    $template = NotarialTemplate::query()->forceCreate([
        'module' => 'legal',
        'code' => 'legal-editor-master',
        'label' => 'Legal Editor Master',
        'document_code' => 'DEMAND_LETTER',
        'document_category' => 'case_documents',
        'default_notarial_act_type' => 'acknowledgment',
        'is_active' => true,
        'created_by' => $user->id,
    ]);

    return NotarialGeneratedDocument::query()->forceCreate([
        'module' => 'legal',
        'notarial_template_id' => $template->id,
        'template_code' => $template->code,
        'template_label' => $template->label,
        'document_code' => $template->document_code,
        'document_category' => $template->document_category,
        'notarial_act_type' => $template->default_notarial_act_type,
        'party_name' => 'Northpoint Trading Corporation',
        'filename' => 'northpoint-demand-letter.docx',
        'path' => $path,
        'disk' => config('filesystems.default', 'local'),
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => strlen($contents),
        'created_by' => $user->id,
        'generated_at' => now(),
    ]);
}
