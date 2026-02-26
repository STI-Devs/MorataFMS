<?php

use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    // Fake the S3 disk to prevent actual AWS calls
    Storage::fake('s3');
});

test('unauthenticated users cannot access document endpoints', function () {
    $response = $this->getJson('/api/documents');
    $response->assertStatus(401);

    $response = $this->postJson('/api/documents', []);
    $response->assertStatus(401);
});

test('authenticated users can list documents', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $this->actingAs($user);

    $response = $this->getJson('/api/documents');
    $response->assertStatus(200);
});

test('encoder can upload a document to an import transaction', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create();
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
    Storage::disk('s3')->assertExists($document->path);
});

test('file upload validates file type', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create();
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
    $import = ImportTransaction::factory()->create();
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
    $import = ImportTransaction::factory()->create();
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
    $import1 = ImportTransaction::factory()->create();
    $import2 = ImportTransaction::factory()->create();

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

    $response = $this->getJson('/api/documents?' . http_build_query([
        'documentable_type' => 'App\Models\ImportTransaction',
        'documentable_id' => $import1->id,
    ]));

    $response->assertStatus(200);
    $response->assertJsonCount(1, 'data');
});

test('user can download their uploaded document', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create();
    $file = UploadedFile::fake()->create('invoice.pdf', 100, 'application/pdf');

    Storage::fake('s3');

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

test('supervisor can delete any document', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $supervisor = User::factory()->create(['role' => 'supervisor']);
    $import = ImportTransaction::factory()->create();

    Storage::fake('s3');

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

    // Supervisor deletes it
    $this->actingAs($supervisor);
    $response = $this->deleteJson("/api/documents/{$documentId}");
    $response->assertStatus(204);

    // Verify database deletion
    $this->assertDatabaseMissing('documents', ['id' => $documentId]);

    // Verify S3 deletion
    Storage::disk('s3')->assertMissing($document->path);
});

test('encoder cannot delete another users document', function () {
    $encoder1 = User::factory()->create(['role' => 'encoder']);
    $encoder2 = User::factory()->create(['role' => 'encoder']);
    $import = ImportTransaction::factory()->create();

    Storage::fake('s3');

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
    $import = ImportTransaction::factory()->create();

    Storage::fake('s3');

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
    Storage::disk('s3')->assertMissing($document->path);
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
