<?php

use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->documentDisk = config('filesystems.document_disk', 's3');

    Storage::fake($this->documentDisk);
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
    $file = UploadedFile::fake()->create('large.pdf', 11000, 'application/pdf'); // 11 MB

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

test('signed local stream can be opened after an authorized preview request', function () {
    config()->set('filesystems.document_disk', 'local');
    Storage::fake('local');

    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);
    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $encoder->id,
        'path' => 'documents/test/restricted.pdf',
    ]);

    Storage::disk('local')->put($document->path, 'restricted');

    $previewResponse = $this->actingAs($encoder)
        ->getJson("/api/documents/{$document->id}/preview")
        ->assertOk();

    $signedUrl = $previewResponse->json('url');

    app('auth')->forgetGuards();

    $this
        ->get($signedUrl)
        ->assertOk();
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

    expect($path)->toContain("documents/imports/{$year}/{$monthPad}-{$monthName}/42/invoice_my_invoice_");
    expect($path)->toContain('.pdf'); // Extension preserved correctly

    // With BL number — uses BL slug as folder
    $pathWithBl = Document::generateS3Path(
        'App\Models\ExportTransaction',
        10,
        'bl',
        'bill-of-lading.pdf',
        'BL-78542136',
        2025,
        false,
        7, // July
    );

    expect($pathWithBl)->toContain('documents/exports/2025/07-July/BL-78542136/bl_bill_of_lading_');
    expect($pathWithBl)->toContain('.pdf');
});
