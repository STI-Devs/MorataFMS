<?php

use App\Models\LegalParty;
use App\Models\NotarialBook;
use App\Models\NotarialLegacyFile;
use App\Models\NotarialPageScan;
use App\Models\NotarialTemplate;
use App\Models\NotarialTemplateRecord;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
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

test('legal users can browse the notarial catalog', function () {
    $paralegal = User::factory()->create([
        'role' => 'paralegal',
    ]);

    $this->actingAs($paralegal)
        ->getJson('/api/notarial/document-types')
        ->assertOk()
        ->assertJsonPath('categories.0.code', 'affidavit_oath')
        ->assertJsonPath('document_types.0.code', 'AFFIDAVIT_GENERAL')
        ->assertJsonPath('template_field_types.0.code', 'text');
});

test('admin can create a notarial template with a docx master file', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/api/notarial/templates', [
            'code' => 'affidavit-loss-master',
            'label' => 'Affidavit of Loss',
            'document_code' => 'AFFIDAVIT_LOSS',
            'field_schema' => json_encode([
                ['name' => 'affiant_name', 'label' => 'Affiant Name', 'type' => 'text', 'required' => true],
                ['name' => 'lost_item', 'label' => 'Lost Item', 'type' => 'text', 'required' => true],
            ], JSON_THROW_ON_ERROR),
            'file' => fakeDocxUpload('affidavit-of-loss.docx', [
                'Affidavit of Loss',
                'Affiant: ${affiant_name}',
                'Lost Item: ${lost_item}',
            ]),
        ])
        ->assertCreated()
        ->assertJsonPath('data.code', 'affidavit-loss-master')
        ->assertJsonPath('data.template_status', 'ready');

    expect(NotarialTemplate::query()->where('code', 'affidavit-loss-master')->exists())->toBeTrue();
});

test('paralegal can create a notarial template with a docx master file', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $this->actingAs($paralegal)
        ->post('/api/notarial/templates', [
            'code' => 'affidavit-support-master',
            'label' => 'Affidavit of Support',
            'document_code' => 'AFFIDAVIT_SUPPORT',
            'field_schema' => json_encode([
                ['name' => 'affiant_name', 'label' => 'Affiant Name', 'type' => 'text', 'required' => true],
            ], JSON_THROW_ON_ERROR),
            'file' => fakeDocxUpload('affidavit-of-support.docx', [
                'Affidavit of Support',
                'Affiant: ${affiant_name}',
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
            'field_schema' => json_encode([
                ['name' => 'affiant_name', 'label' => 'Affiant Name', 'type' => 'text', 'required' => true],
            ], JSON_THROW_ON_ERROR),
            'file' => UploadedFile::fake()->create(
                'affidavit-of-support.docx',
                128,
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ),
        ])
        ->assertCreated()
        ->assertJsonPath('data.code', 'affidavit-support-master');
});

test('paralegal can generate a template record and sync the legal party directory', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $book = makeBook([
        'book_number' => 7,
        'year' => 2026,
        'status' => 'active',
        'opened_at' => now(),
        'created_by' => $admin->id,
    ]);

    /** @var UploadedFile $templateFile */
    $templateFile = fakeDocxUpload('affidavit-of-loss.docx', [
        'Affidavit of Loss',
        'Party: ${party_name}',
        'Affiant: ${affiant_name}',
        'Lost Item: ${lost_item}',
        'Address: ${principal_address}',
    ]);

    $templateResponse = $this->actingAs($admin)->post('/api/notarial/templates', [
        'code' => 'affidavit-loss-master',
        'label' => 'Affidavit of Loss',
        'document_code' => 'AFFIDAVIT_LOSS',
        'field_schema' => json_encode([
            ['name' => 'affiant_name', 'label' => 'Affiant Name', 'type' => 'text', 'required' => true],
            ['name' => 'lost_item', 'label' => 'Lost Item', 'type' => 'text', 'required' => true],
            ['name' => 'principal_address', 'label' => 'Address', 'type' => 'text', 'required' => false],
        ], JSON_THROW_ON_ERROR),
        'file' => $templateFile,
    ]);

    $templateResponse->assertCreated();
    $templateId = $templateResponse->json('data.id');

    $response = $this->actingAs($paralegal)
        ->postJson('/api/notarial/template-records', [
            'notarial_template_id' => $templateId,
            'notarial_book_id' => $book->id,
            'party_name' => 'Maria Santos',
            'notes' => 'Generated by the assistant.',
            'template_data' => [
                'party_name' => 'Maria Santos',
                'affiant_name' => 'Maria Santos',
                'lost_item' => 'Passport',
                'principal_address' => 'Rizal Avenue, Tagum City',
            ],
        ]);

    $response->assertCreated()
        ->assertJsonPath('data.party_name', 'Maria Santos')
        ->assertJsonPath('data.book.book_number', 7)
        ->assertJsonPath('data.generated_file.mime_type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    expect(NotarialTemplateRecord::query()->count())->toBe(1);
    expect(LegalParty::query()->where('name', 'Maria Santos')->value('principal_address'))->toBe('Rizal Avenue, Tagum City');
    Storage::disk(config('filesystems.default', 'local'))->assertExists(NotarialTemplateRecord::query()->firstOrFail()->path);
});

test('template records can be filtered by category, act type, and archived book', function () {
    Storage::fake(config('filesystems.default', 'local'));

    $admin = User::factory()->create(['role' => 'admin']);
    $paralegal = User::factory()->create(['role' => 'paralegal']);

    $book = makeBook([
        'book_number' => 9,
        'year' => 2026,
        'status' => 'active',
        'opened_at' => now(),
        'created_by' => $admin->id,
    ]);

    $template = NotarialTemplate::query()->create([
        'code' => 'spa-master',
        'label' => 'Special Power of Attorney',
        'document_code' => 'SPECIAL_POWER_OF_ATTORNEY',
        'document_category' => 'power_of_attorney',
        'default_notarial_act_type' => 'acknowledgment',
        'field_schema' => [],
        'is_active' => true,
        'filename' => 'spa-master.docx',
        'path' => 'notarial-templates/power_of_attorney/spa-master.docx',
        'disk' => config('filesystems.default', 'local'),
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => 100,
        'created_by' => $admin->id,
    ]);

    NotarialTemplateRecord::query()->create([
        'notarial_template_id' => $template->id,
        'notarial_book_id' => $book->id,
        'template_code' => $template->code,
        'template_label' => $template->label,
        'document_code' => $template->document_code,
        'document_category' => $template->document_category,
        'notarial_act_type' => $template->default_notarial_act_type,
        'party_name' => 'Northpoint Trading Corporation',
        'template_data' => ['principal_name' => 'Northpoint Trading Corporation'],
        'filename' => 'northpoint-spa.docx',
        'path' => 'notarial-generated/2026/spa-master/northpoint-spa.docx',
        'disk' => config('filesystems.default', 'local'),
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'size_bytes' => 100,
        'created_by' => $paralegal->id,
        'generated_at' => now(),
    ]);

    $this->actingAs($paralegal)
        ->getJson("/api/notarial/template-records?document_category=power_of_attorney&notarial_act_type=acknowledgment&book_id={$book->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.template_code', 'spa-master')
        ->assertJsonPath('data.0.book.book_number', 9);
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
    $book = new NotarialBook($attributes);
    $book->status = (string) ($attributes['status'] ?? 'archived');
    $book->opened_at = $attributes['opened_at'] ?? null;
    $book->closed_at = $attributes['closed_at'] ?? null;
    $book->created_by = (int) $attributes['created_by'];
    $book->save();

    return $book;
}
