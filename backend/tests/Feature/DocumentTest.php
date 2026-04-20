<?php

use App\Actions\Documents\StoreTransactionDocument;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->documentDisk = config('filesystems.document_disk', 's3');

    Storage::fake($this->documentDisk);
});

afterEach(function () {
    Carbon::setTestNow();
});

test('unauthenticated users cannot access document endpoints', function () {
    $response = $this->getJson('/api/documents');
    $response->assertStatus(401);

    $response = $this->postJson('/api/documents', []);
    $response->assertStatus(401);
});

test('admin can list documents', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $this->actingAs($admin);

    $response = $this->getJson('/api/documents');
    $response->assertOk();
});

test('encoders can only list their own documents', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $ownedTransaction = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);
    $otherTransaction = ImportTransaction::factory()->create(['assigned_user_id' => $otherEncoder->id]);

    $ownedDocument = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $ownedTransaction->id,
    ]);
    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $otherTransaction->id,
    ]);

    $response = $this->actingAs($encoder)->getJson('/api/documents');

    $response->assertOk()->assertJsonCount(1, 'data');
    expect($response->json('data.0.id'))->toBe($ownedDocument->id);
});

test('encoders can only list their own finalized document transactions with pagination', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);

    $importTransaction = ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-DOC-001',
        'bl_no' => 'BL-IMP-DOC-001',
        'status' => 'Completed',
        'assigned_user_id' => $user->id,
    ]);
    Document::factory()->count(2)->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $importTransaction->id,
    ]);

    ExportTransaction::factory()->create([
        'bl_no' => 'BL-EXP-DOC-001',
        'status' => 'Cancelled',
        'assigned_user_id' => $otherEncoder->id,
    ]);

    ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-PENDING-001',
        'bl_no' => 'BL-PENDING-001',
        'status' => 'Pending',
        'assigned_user_id' => $otherEncoder->id,
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/documents/transactions?type=import&search=IMP-DOC&per_page=1')
        ->assertOk();

    $response
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('counts.imports', 1)
        ->assertJsonPath('counts.exports', 0)
        ->assertJsonPath('counts.completed', 1)
        ->assertJsonPath('counts.cancelled', 0)
        ->assertJsonPath('data.0.ref', 'IMP-DOC-001')
        ->assertJsonPath('data.0.documents_count', 2);
});

test('admin can list all finalized document transactions', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-ADMIN-001',
        'bl_no' => 'BL-IMP-ADMIN-001',
        'status' => 'Completed',
    ]);
    ExportTransaction::factory()->create([
        'bl_no' => 'BL-EXP-ADMIN-001',
        'status' => 'Cancelled',
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/documents/transactions?per_page=10');

    $response->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('counts.imports', 1)
        ->assertJsonPath('counts.exports', 1);
});

test('s3 disk throws upload exceptions while app debug is enabled', function () {
    $originalAppDebug = getenv('APP_DEBUG');
    $originalEnvAppDebug = $_ENV['APP_DEBUG'] ?? null;
    $originalServerAppDebug = $_SERVER['APP_DEBUG'] ?? null;

    putenv('APP_DEBUG=true');
    $_ENV['APP_DEBUG'] = 'true';
    $_SERVER['APP_DEBUG'] = 'true';

    try {
        $filesystems = require base_path('config/filesystems.php');

        expect($filesystems['disks']['s3']['throw'])->toBeTrue();
    } finally {
        if ($originalAppDebug === false) {
            putenv('APP_DEBUG');
        } else {
            putenv("APP_DEBUG={$originalAppDebug}");
        }

        if ($originalEnvAppDebug === null) {
            unset($_ENV['APP_DEBUG']);
        } else {
            $_ENV['APP_DEBUG'] = $originalEnvAppDebug;
        }

        if ($originalServerAppDebug === null) {
            unset($_SERVER['APP_DEBUG']);
        } else {
            $_SERVER['APP_DEBUG'] = $originalServerAppDebug;
        }
    }
});

test('encoder can upload a document to an import transaction', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $user->id]);
    $file = UploadedFile::fake()->create('invoice.pdf', 1024, 'application/pdf');

    $this->actingAs($user);

    $response = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $response->assertStatus(201);
    $response->assertJsonStructure([
        'data' => ['id', 'type', 'filename', 'size_bytes', 'formatted_size', 'uploaded_by'],
    ]);

    // Verify database record
    $this->assertDatabaseHas('documents', [
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
        'uploaded_by' => $user->id,
    ]);

    // Verify file was stored in S3
    $document = Document::latest()->first();
    Storage::disk($this->documentDisk)->assertExists($document->path);
});

test('operational roles can upload only their allowed stage documents', function (
    string $role,
    string $transactionClass,
    string $documentType,
) {
    $user = User::factory()->create(['role' => $role]);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = $transactionClass::factory()->pending()->create(['assigned_user_id' => $encoder->id]);
    $file = UploadedFile::fake()->create('task-document.pdf', 100, 'application/pdf');

    if ($transaction instanceof ImportTransaction) {
        $transaction->stages()->update(match ($documentType) {
            'ppa' => [
                'boc_status' => 'completed',
                'bonds_status' => 'completed',
                'ppa_status' => 'pending',
            ],
            'billing' => [
                'boc_status' => 'completed',
                'bonds_status' => 'completed',
                'ppa_status' => 'completed',
                'do_status' => 'completed',
                'port_charges_status' => 'completed',
                'releasing_status' => 'completed',
                'billing_status' => 'pending',
            ],
            default => [],
        });
    }

    if ($transaction instanceof ExportTransaction) {
        $transaction->stages()->update(match ($documentType) {
            'cil' => [
                'docs_prep_status' => 'completed',
                'bl_status' => 'completed',
                'phytosanitary_status' => 'completed',
                'co_status' => 'completed',
                'cil_status' => 'pending',
                'dccci_status' => 'pending',
            ],
            'dccci' => [
                'docs_prep_status' => 'completed',
                'bl_status' => 'completed',
                'phytosanitary_status' => 'completed',
                'co_status' => 'completed',
                'cil_status' => 'completed',
                'dccci_status' => 'pending',
            ],
            'billing' => [
                'docs_prep_status' => 'completed',
                'bl_status' => 'completed',
                'phytosanitary_status' => 'completed',
                'co_status' => 'completed',
                'cil_status' => 'completed',
                'dccci_status' => 'completed',
                'billing_status' => 'pending',
            ],
            default => [],
        });
    }

    $this->actingAs($user)
        ->postJson('/api/documents', [
            'file' => $file,
            'type' => $documentType,
            'documentable_type' => $transactionClass,
            'documentable_id' => $transaction->id,
        ])
        ->assertCreated();

    $this->assertDatabaseHas('documents', [
        'type' => $documentType,
        'documentable_type' => $transactionClass,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $user->id,
    ]);
})->with([
    'processor import ppa' => ['processor', ImportTransaction::class, 'ppa'],
    'processor export cil' => ['processor', ExportTransaction::class, 'cil'],
    'processor export dccci' => ['processor', ExportTransaction::class, 'dccci'],
    'accounting import billing' => ['accounting', ImportTransaction::class, 'billing'],
    'accounting export billing' => ['accounting', ExportTransaction::class, 'billing'],
]);

test('operational roles cannot upload document types outside their workflow stages', function (
    string $role,
    string $transactionClass,
    string $documentType,
) {
    $user = User::factory()->create(['role' => $role]);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = $transactionClass::factory()->create(['assigned_user_id' => $encoder->id]);
    $file = UploadedFile::fake()->create('restricted-document.pdf', 100, 'application/pdf');

    $this->actingAs($user)
        ->postJson('/api/documents', [
            'file' => $file,
            'type' => $documentType,
            'documentable_type' => $transactionClass,
            'documentable_id' => $transaction->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type'])
        ->assertJsonPath('errors.type.0', 'You are not allowed to upload this document type for the selected transaction.');
})->with([
    'processor import boc' => ['processor', ImportTransaction::class, 'boc'],
    'processor export billing' => ['processor', ExportTransaction::class, 'billing'],
    'accounting import ppa' => ['accounting', ImportTransaction::class, 'ppa'],
    'accounting export cil' => ['accounting', ExportTransaction::class, 'cil'],
    'accounting export dccci' => ['accounting', ExportTransaction::class, 'dccci'],
]);

test('operational roles cannot upload their stage before it is ready', function () {
    $processor = User::factory()->create(['role' => 'processor']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->pending()->create(['assigned_user_id' => $encoder->id]);

    $transaction->stages()->update([
        'boc_status' => 'completed',
        'bonds_status' => 'pending',
        'ppa_status' => 'pending',
    ]);

    $this->actingAs($processor)
        ->postJson('/api/documents', [
            'file' => UploadedFile::fake()->create('ppa.pdf', 100, 'application/pdf'),
            'type' => 'ppa',
            'documentable_type' => ImportTransaction::class,
            'documentable_id' => $transaction->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type'])
        ->assertJsonPath('errors.type.0', 'This stage is not ready for upload yet.');
});

test('encoder cannot upload a later export stage before the earlier required stage is complete', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ExportTransaction::factory()->pending()->create(['assigned_user_id' => $encoder->id]);

    $transaction->stages()->update([
        'docs_prep_status' => 'pending',
        'bl_status' => 'pending',
    ]);

    $this->actingAs($encoder)
        ->postJson('/api/documents', [
            'file' => UploadedFile::fake()->create('bl.pdf', 100, 'application/pdf'),
            'type' => 'bl_generation',
            'documentable_type' => ExportTransaction::class,
            'documentable_id' => $transaction->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type'])
        ->assertJsonPath('errors.type.0', 'This stage is not ready for upload yet.');
});

test('document upload stops when the configured disk write fails', function () {
    config()->set('filesystems.document_disk', 's3');

    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->pending()->create(['assigned_user_id' => $user->id]);

    $disk = Mockery::mock();
    $disk->shouldReceive('writeStream')->once()->andReturnFalse();

    Storage::shouldReceive('disk')
        ->twice()
        ->with('s3')
        ->andReturn($disk);

    $this->withoutExceptionHandling();

    expect(fn () => $this->actingAs($user)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('invoice.pdf', 1024, 'application/pdf'),
        'type' => 'boc',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $import->id,
    ]))->toThrow(RuntimeException::class, 'Unable to write document to the [s3] disk.');

    $this->assertDatabaseCount('documents', 0);
});

test('encoder can upload additional documents to a completed transaction', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->completed()->create(['assigned_user_id' => $user->id]);
    Document::factory()->create([
        'type' => 'billing',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $import->id,
        'uploaded_by' => $user->id,
    ]);

    $response = $this->actingAs($user)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('additional.pdf', 256, 'application/pdf'),
        'type' => 'others',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $import->id,
    ]);

    $response->assertCreated();

    $import->refresh();

    expect($import->status->value)->toBe('Completed');
});

test('encoder cannot upload a document to another encoders transaction', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $otherEncoder->id]);
    $file = UploadedFile::fake()->create('invoice.pdf', 1024, 'application/pdf');

    $response = $this->actingAs($encoder)->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $import->id,
    ]);

    $response->assertForbidden();
});

test('file upload validates file type', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $user->id]);
    $file = UploadedFile::fake()->create('malware.exe', 100);

    $this->actingAs($user);

    $response = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['file']);
});

test('file upload validates file size limit', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $user->id]);
    $file = UploadedFile::fake()->create('large.pdf', 21000, 'application/pdf');

    $this->actingAs($user);

    $response = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['file']);
});

test('file upload returns a clear message when php rejects the uploaded file before validation', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $user->id]);
    $temporaryFile = tempnam(sys_get_temp_dir(), 'upload-test-');

    expect($temporaryFile)->not->toBeFalse();

    file_put_contents($temporaryFile, 'test');

    $file = new UploadedFile(
        $temporaryFile,
        'too-large.png',
        'image/png',
        UPLOAD_ERR_INI_SIZE,
        true,
    );

    $this->actingAs($user);

    $response = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $import->id,
    ]);

    unlink($temporaryFile);

    $response->assertStatus(422);
    $response->assertJsonPath(
        'errors.file.0',
        'The file could not be uploaded by the server. If the file is within the 20 MB app limit, increase the PHP upload limit and try again.',
    );
});

test('file upload validates document type', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $user->id]);
    $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

    $this->actingAs($user);

    $response = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'invalid_type',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['type']);
});

test('file upload validates documentable_id exists', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

    $this->actingAs($user);

    $response = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => 99999, // Non-existent ID
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['documentable_id']);
});

test('documents can be filtered by transaction', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $import1 = ImportTransaction::factory()->create(['assigned_user_id' => $user->id]);
    $import2 = ImportTransaction::factory()->create(['assigned_user_id' => $otherEncoder->id]);

    // Create documents for both transactions
    Document::factory()->create([
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import1->id,
    ]);
    Document::factory()->create([
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import2->id,
    ]);

    $this->actingAs($user);

    $response = $this->getJson('/api/documents?'.http_build_query([
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import1->id,
    ]));

    $response->assertStatus(200);
    $response->assertJsonCount(1, 'data');
});

test('user can download their uploaded document', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $user->id]);
    $file = UploadedFile::fake()->create('invoice.pdf', 100, 'application/pdf');

    Storage::fake($this->documentDisk);

    // Upload document
    $this->actingAs($user);
    $uploadResponse = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $documentId = $uploadResponse->json('data.id');

    // Download document
    $response = $this->get("/api/documents/{$documentId}/download");
    $response->assertStatus(200);
    $response->assertHeader('content-disposition');
});

test('encoder cannot preview another encoders document', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $otherEncoder->id]);
    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $otherEncoder->id,
    ]);

    $this->actingAs($encoder)
        ->getJson("/api/documents/{$document->id}/preview")
        ->assertForbidden();
});

test('encoder cannot download another encoders document', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $otherEncoder->id]);
    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $otherEncoder->id,
    ]);

    $this->actingAs($encoder)
        ->get("/api/documents/{$document->id}/download")
        ->assertForbidden();
});

test('document preview streams the file inline for the authorized user', function () {
    config()->set('filesystems.document_disk', 'local');
    Storage::fake('local');

    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);
    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $encoder->id,
        'path' => 'transaction-documents/test/restricted.pdf',
        'filename' => 'restricted.pdf',
    ]);

    Storage::disk('local')->put($document->path, 'restricted');

    $this->actingAs($encoder)
        ->get("/api/documents/{$document->id}/preview")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', 'inline; filename="restricted.pdf"');
});

test('document preview falls back to filename mime type when disk mime detection fails', function () {
    config()->set('filesystems.document_disk', 'local');

    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);
    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $encoder->id,
        'path' => 'transaction-documents/test/restricted.pdf',
        'filename' => 'restricted.pdf',
    ]);

    $temporaryFile = tmpfile();

    expect($temporaryFile)->not->toBeFalse();

    fwrite($temporaryFile, 'restricted');
    rewind($temporaryFile);

    $disk = Mockery::mock(FilesystemAdapter::class);
    $disk->shouldReceive('exists')
        ->once()
        ->with($document->path)
        ->andReturnTrue();
    $disk->shouldReceive('readStream')
        ->once()
        ->with($document->path)
        ->andReturn($temporaryFile);

    Storage::shouldReceive('disk')
        ->once()
        ->with('local')
        ->andReturn($disk);

    $this->actingAs($encoder)
        ->get("/api/documents/{$document->id}/preview")
        ->assertOk()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', 'inline; filename="restricted.pdf"');
});

test('document stream now requires an authenticated authorized session', function () {
    config()->set('filesystems.document_disk', 'local');
    Storage::fake('local');

    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);
    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $encoder->id,
        'path' => 'transaction-documents/test/restricted.pdf',
    ]);

    Storage::disk('local')->put($document->path, 'restricted');

    $this->get("/api/documents/{$document->id}/stream")->assertUnauthorized();
});

test('admin can delete any document', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $admin = User::factory()->create(['role' => 'admin']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);

    Storage::fake($this->documentDisk);

    // Encoder uploads document
    $this->actingAs($encoder);
    $file = UploadedFile::fake()->create('invoice.pdf', 100, 'application/pdf');
    $uploadResponse = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $documentId = $uploadResponse->json('data.id');
    $document = Document::find($documentId);

    // Admin deletes it
    $this->actingAs($admin);
    $response = $this->deleteJson("/api/documents/{$documentId}");
    $response->assertStatus(204);

    // Verify database deletion
    $this->assertDatabaseMissing('documents', ['id' => $documentId]);

    // Verify S3 deletion
    Storage::disk($this->documentDisk)->assertMissing($document->path);
});

test('encoder cannot delete another users document', function () {
    $encoder1 = User::factory()->create(['role' => 'encoder']);
    $encoder2 = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $encoder1->id]);

    Storage::fake($this->documentDisk);

    // Encoder 1 uploads document
    $this->actingAs($encoder1);
    $file = UploadedFile::fake()->create('invoice.pdf', 100, 'application/pdf');
    $uploadResponse = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $documentId = $uploadResponse->json('data.id');

    // Encoder 2 tries to delete it
    $this->actingAs($encoder2);
    $response = $this->deleteJson("/api/documents/{$documentId}");
    $response->assertStatus(403); // Forbidden
});

test('user can delete their own uploaded document', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);

    Storage::fake($this->documentDisk);

    // Upload document
    $this->actingAs($encoder);
    $file = UploadedFile::fake()->create('invoice.pdf', 100, 'application/pdf');
    $uploadResponse = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $documentId = $uploadResponse->json('data.id');
    $document = Document::find($documentId);

    // Delete own document
    $response = $this->deleteJson("/api/documents/{$documentId}");
    $response->assertStatus(204);

    // Verify deletion
    $this->assertDatabaseMissing('documents', ['id' => $documentId]);
    Storage::disk($this->documentDisk)->assertMissing($document->path);
});

test('operational upload stamps and clears stage completion ownership', function () {
    $processor = User::factory()->create(['role' => 'processor']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->pending()->create(['assigned_user_id' => $encoder->id]);

    $transaction->stages()->update([
        'boc_status' => 'completed',
        'bonds_status' => 'completed',
        'ppa_status' => 'pending',
    ]);

    $uploadResponse = $this->actingAs($processor)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('ppa.pdf', 100, 'application/pdf'),
        'type' => 'ppa',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
    ]);

    $uploadResponse->assertCreated();

    $transaction->refresh()->load('stages');

    expect($transaction->stages->ppa_completed_by)->toBe($processor->id);
    expect($transaction->stages->ppa_completed_at)->not->toBeNull();

    $documentId = $uploadResponse->json('data.id');

    $this->actingAs($processor)
        ->deleteJson("/api/documents/{$documentId}")
        ->assertNoContent();

    $transaction->refresh()->load('stages');

    expect($transaction->stages->ppa_status->value)->toBe('pending');
    expect($transaction->stages->ppa_completed_by)->toBeNull();
    expect($transaction->stages->ppa_completed_at)->toBeNull();
});

test('encoder can upload a document with type others', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $user->id]);
    $file = UploadedFile::fake()->create('extra.pdf', 512, 'application/pdf');

    $this->actingAs($user);

    $response = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'others',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $response->assertStatus(201);
    $this->assertDatabaseHas('documents', [
        'type' => 'others',
        'documentable_id' => $import->id,
    ]);
});

test('live document uploads use the current upload month in S3 paths', function () {
    Carbon::setTestNow('2026-04-06 04:39:14');

    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create([
        'assigned_user_id' => $user->id,
        'arrival_date' => '2026-03-28',
        'bl_no' => 'BL-LIVE-UPLOAD-001',
    ]);

    $this->actingAs($user)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('invoice.pdf', 1024, 'application/pdf'),
        'type' => 'boc',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $import->id,
    ])->assertCreated();

    $document = Document::latest()->first();

    expect($document?->path)->toStartWith('transaction-documents/imports/2026/month-04-April/BL-LIVE-UPLOAD-001/');
});

test('document generates correct S3 path', function () {
    $year = now()->year;
    $monthPad = str_pad(now()->month, 2, '0', STR_PAD_LEFT);
    $monthName = date('F');

    // Without BL number — falls back to documentable_id
    $path = Document::generateS3Path(
        'App\Models\ImportTransaction',
        42,
        'invoice',
        'my-invoice.pdf'
    );

    expect($path)->toContain("transaction-documents/imports/{$year}/month-{$monthPad}-{$monthName}/42/invoice_my_invoice_");
    expect($path)->toContain('.pdf'); // Extension preserved correctly

    // With BL number — uses BL slug as folder
    $pathWithBl = Document::generateS3Path(
        'App\Models\ExportTransaction',
        10,
        'bl',
        'bill-of-lading.pdf',
        'BL-78542136',
        2025,
        7, // July
    );

    expect($pathWithBl)->toContain('transaction-documents/exports/2025/month-07-July/BL-78542136/bl_bill_of_lading_');
    expect($pathWithBl)->toContain('.pdf');
});

test('admin can replace any archive document', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $admin = User::factory()->create(['role' => 'admin']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);

    Storage::fake($this->documentDisk);

    $this->actingAs($encoder);
    $file = UploadedFile::fake()->create('old.pdf', 100, 'application/pdf');
    $uploadResponse = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $documentId = $uploadResponse->json('data.id');
    $document = Document::find($documentId);

    $this->actingAs($admin);
    $newFile = UploadedFile::fake()->create('new.pdf', 100, 'application/pdf');
    $response = $this->postJson("/api/documents/{$documentId}/replace", [
        'file' => $newFile,
    ]);

    $response->assertStatus(201);
    $newDocumentId = $response->json('data.id');

    $this->assertDatabaseMissing('documents', ['id' => $documentId]);
    Storage::disk($this->documentDisk)->assertMissing($document->path);

    $this->assertDatabaseHas('documents', ['id' => $newDocumentId]);
    $newDocument = Document::find($newDocumentId);
    Storage::disk($this->documentDisk)->assertExists($newDocument->path);
});

test('encoder can replace their own archive document', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);

    Storage::fake($this->documentDisk);

    $this->actingAs($encoder);
    $file = UploadedFile::fake()->create('old.pdf', 100, 'application/pdf');
    $uploadResponse = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $documentId = $uploadResponse->json('data.id');

    $newFile = UploadedFile::fake()->create('new.pdf', 100, 'application/pdf');
    $response = $this->postJson("/api/documents/{$documentId}/replace", [
        'file' => $newFile,
    ]);

    $response->assertStatus(201);
    $newDocumentId = $response->json('data.id');
    expect($newDocumentId)->not->toBe($documentId);
    $this->assertDatabaseMissing('documents', ['id' => $documentId]);
    $this->assertDatabaseHas('documents', ['id' => $newDocumentId]);
});

test('encoder cannot replace another users archive document', function () {
    $encoder1 = User::factory()->create(['role' => 'encoder']);
    $encoder2 = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $encoder1->id]);

    Storage::fake($this->documentDisk);

    $this->actingAs($encoder1);
    $file = UploadedFile::fake()->create('old.pdf', 100, 'application/pdf');
    $uploadResponse = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);

    $documentId = $uploadResponse->json('data.id');

    $this->actingAs($encoder2);
    $newFile = UploadedFile::fake()->create('new.pdf', 100, 'application/pdf');
    $response = $this->postJson("/api/documents/{$documentId}/replace", [
        'file' => $newFile,
    ]);

    $response->assertStatus(403);
});

test('replace validates file is required', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);

    $this->actingAs($encoder);
    $file = UploadedFile::fake()->create('old.pdf', 100, 'application/pdf');
    $uploadResponse = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);
    $documentId = $uploadResponse->json('data.id');

    $response = $this->postJson("/api/documents/{$documentId}/replace", []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['file']);
});

test('replace validates file size', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);

    $this->actingAs($encoder);
    $file = UploadedFile::fake()->create('old.pdf', 100, 'application/pdf');
    $uploadResponse = $this->postJson('/api/documents', [
        'file' => $file,
        'type' => 'boc',
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import->id,
    ]);
    $documentId = $uploadResponse->json('data.id');

    $largeFile = UploadedFile::fake()->create('large.pdf', 21000, 'application/pdf');
    $response = $this->postJson("/api/documents/{$documentId}/replace", [
        'file' => $largeFile,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['file']);
});

test('replace keeps the original archive document when storing the new file fails', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);
    $document = Document::factory()->create([
        'type' => 'boc',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $import->id,
        'uploaded_by' => $encoder->id,
        'path' => 'transaction-documents/imports/2026/month-04-April/BL-REPLACE-001/boc_old.pdf',
        'filename' => 'old.pdf',
    ]);

    Storage::disk($this->documentDisk)->put($document->path, 'original file contents');

    $storeTransactionDocument = Mockery::mock(StoreTransactionDocument::class);
    $storeTransactionDocument
        ->shouldReceive('handle')
        ->once()
        ->andThrow(new RuntimeException('Unable to write document to the [s3] disk.'));

    $this->app->instance(StoreTransactionDocument::class, $storeTransactionDocument);
    $this->withoutExceptionHandling();

    expect(fn () => $this->actingAs($encoder)->postJson("/api/documents/{$document->id}/replace", [
        'file' => UploadedFile::fake()->create('new.pdf', 100, 'application/pdf'),
    ]))->toThrow(RuntimeException::class, 'Unable to write document to the [s3] disk.');

    $this->assertDatabaseHas('documents', ['id' => $document->id]);
    Storage::disk($this->documentDisk)->assertExists($document->path);
});
