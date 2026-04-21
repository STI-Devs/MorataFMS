<?php

use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchStatus;
use App\Models\AuditLog;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config()->set('filesystems.document_disk', 'local');
    $this->documentDisk = config('filesystems.document_disk', 'local');
    Storage::fake($this->documentDisk);
});

test('unauthenticated users cannot access legacy batch endpoints', function () {
    $this->getJson('/api/legacy-batches')->assertUnauthorized();
    $this->postJson('/api/legacy-batches', [])->assertUnauthorized();
});

test('admin can create a legacy batch manifest and preserved storage paths', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2023,
        'year_to' => 2026,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/KOTA HAKIM 2350W/BL COPIES/KOTA HAKIM 2350W BL.pdf',
                'size_bytes' => 524288,
                'mime_type' => 'application/pdf',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
            [
                'relative_path' => 'VESSEL 1/ED CANCELLATION/ED CANCELLATION NOTICE.pdf',
                'size_bytes' => 220000,
                'mime_type' => 'application/pdf',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.batch_name', 'VESSEL 1 — Historical Archive')
        ->assertJsonPath('data.root_folder', 'VESSEL 1')
        ->assertJsonPath('data.status', LegacyBatchStatus::Draft->value)
        ->assertJsonPath('data.metadata.year', '2023 - 2026')
        ->assertJsonPath('data.metadata.year_from', 2023)
        ->assertJsonPath('data.metadata.year_to', 2026)
        ->assertJsonPath('data.file_count', 2)
        ->assertJsonPath('data.upload_summary.remaining', 2);

    $batch = LegacyBatch::query()->first();

    expect($batch)->not->toBeNull();
    expect($batch?->files()->count())->toBe(2);
    expect($batch?->files()->first()?->storage_path)->toStartWith('legacy-batches/');
});

test('legacy batch manifest accepts browser-style modified timestamps with milliseconds', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'OJT Files',
        'root_folder' => 'OJT Files',
        'year_from' => 2026,
        'year_to' => 2026,
        'department' => 'Brokerage',
        'notes' => 'Browser-based legacy upload manifest.',
        'files' => [
            [
                'relative_path' => 'OJT Files/Reporting/FIRST WEEK REPORT.pdf',
                'size_bytes' => 223231,
                'mime_type' => 'application/pdf',
                'modified_at' => '2026-01-27T08:01:34.179Z',
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.file_count', 1)
        ->assertJsonPath('data.upload_summary.remaining', 1);

    $batch = LegacyBatch::query()->latest('id')->first();

    expect($batch)->not->toBeNull();
    expect($batch?->files()->first()?->modified_at?->format('Y-m-d H:i:s'))
        ->toBe('2026-01-27 08:01:34');
});

test('admin can append additional manifest chunks before uploads begin', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $createResponse = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2025,
        'year_to' => 2025,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'expected_file_count' => 3,
        'total_size_bytes' => 744288,
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/KOTA HAKIM 2350W/BL COPIES/KOTA HAKIM 2350W BL.pdf',
                'size_bytes' => 524288,
                'mime_type' => 'application/pdf',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $batchId = $createResponse->json('data.id');

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batchId}/manifest", [
            'files' => [
                [
                    'relative_path' => 'VESSEL 1/ED CANCELLATION/ED CANCELLATION NOTICE.pdf',
                    'size_bytes' => 120000,
                    'mime_type' => 'application/pdf',
                    'modified_at' => now()->subYear()->toIso8601String(),
                ],
                [
                    'relative_path' => 'VESSEL 1/KOTA HAKIM/WORKING PAPERS/ENTRY MONITOR.xlsm',
                    'size_bytes' => 100000,
                    'mime_type' => 'application/vnd.ms-excel.sheet.macroEnabled.12',
                    'modified_at' => now()->subYear()->toIso8601String(),
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.registered_file_count', 3)
        ->assertJsonPath('data.expected_file_count', 3)
        ->assertJsonPath('data.remaining_manifest_files', 0);

    $batch = LegacyBatch::query()->where('uuid', $batchId)->first();

    expect($batch)->not->toBeNull();
    expect($batch?->files()->count())->toBe(3);
});

test('admin can append manifest chunks that include newly allowed office and email archive files', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $createResponse = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2025,
        'year_to' => 2025,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'expected_file_count' => 3,
        'total_size_bytes' => 744288,
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/KOTA HAKIM 2350W/BL COPIES/KOTA HAKIM 2350W BL.pdf',
                'size_bytes' => 524288,
                'mime_type' => 'application/pdf',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $batchId = $createResponse->json('data.id');

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batchId}/manifest", [
            'files' => [
                [
                    'relative_path' => 'VESSEL 1/KOTA HAKIM/WORKING PAPERS/ENTRY MONITOR.xlsb',
                    'size_bytes' => 120000,
                    'mime_type' => 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
                    'modified_at' => now()->subYear()->toIso8601String(),
                ],
                [
                    'relative_path' => 'VESSEL 1/KOTA HAKIM/EMAILS/CUSTOMER APPROVAL.msg',
                    'size_bytes' => 100000,
                    'mime_type' => 'application/vnd.ms-outlook',
                    'modified_at' => now()->subYear()->toIso8601String(),
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.registered_file_count', 3)
        ->assertJsonPath('data.expected_file_count', 3)
        ->assertJsonPath('data.remaining_manifest_files', 0);

    $batch = LegacyBatch::query()->where('uuid', $batchId)->first();

    expect($batch)->not->toBeNull();
    expect($batch?->files()->count())->toBe(3);
});

test('encoder only sees their own legacy batches', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);

    LegacyBatch::factory()->create([
        'uploaded_by' => $encoder->id,
        'batch_name' => 'My Legacy Batch',
    ]);
    LegacyBatch::factory()->create([
        'uploaded_by' => $otherEncoder->id,
        'batch_name' => 'Other Legacy Batch',
    ]);

    $response = $this->actingAs($encoder)->getJson('/api/legacy-batches');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.batch_name', 'My Legacy Batch');
});

test('legacy batch index paginates results', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    LegacyBatch::factory()->count(25)->create([
        'uploaded_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->getJson('/api/legacy-batches?per_page=20&page=2')
        ->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('meta.current_page', 2)
        ->assertJsonPath('meta.per_page', 20)
        ->assertJsonPath('meta.total', 25)
        ->assertJsonPath('meta.last_page', 2)
        ->assertJsonPath('meta.from', 21)
        ->assertJsonPath('meta.to', 25);
});

test('legacy batch manifest rejects blocked file extensions', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2025,
        'year_to' => 2025,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/EVIDENCE.mp4',
                'size_bytes' => 524288,
                'mime_type' => 'video/mp4',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['files.0.relative_path']);

    expect($response->json('errors')['files.0.relative_path'][0])
        ->toBe('Only PDF, Office documents, spreadsheets, email message files, text files, and images are allowed in legacy uploads.');
});

test('legacy batch manifest accepts macro-enabled excel files used in transaction folders', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2025,
        'year_to' => 2025,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/WORKING PAPERS/ENTRY MONITOR.xlsm',
                'size_bytes' => 524288,
                'mime_type' => 'application/vnd.ms-excel.sheet.macroEnabled.12',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.file_count', 1)
        ->assertJsonPath('data.upload_summary.remaining', 1);
});

test('legacy batch manifest accepts binary excel and archived email files used in transaction folders', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2025,
        'year_to' => 2025,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/WORKING PAPERS/ENTRY MONITOR.xlsb',
                'size_bytes' => 524288,
                'mime_type' => 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/EMAILS/CUSTOMER APPROVAL.msg',
                'size_bytes' => 128000,
                'mime_type' => 'application/vnd.ms-outlook',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.file_count', 2)
        ->assertJsonPath('data.upload_summary.remaining', 2);
});

test('legacy batch manifest accepts zero-byte files preserved from archive folders', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2025,
        'year_to' => 2025,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'expected_file_count' => 2,
        'total_size_bytes' => 524288,
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/WORKING PAPERS/EMPTY INDEX.txt',
                'size_bytes' => 0,
                'mime_type' => 'text/plain',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/WORKING PAPERS/ENTRY MONITOR.xlsb',
                'size_bytes' => 524288,
                'mime_type' => 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.file_count', 2)
        ->assertJsonPath('data.upload_summary.remaining', 2);

    $batch = LegacyBatch::query()->latest('id')->first();

    expect($batch)->not->toBeNull();
    expect($batch?->files()->where('relative_path', 'VESSEL 1/KOTA HAKIM/WORKING PAPERS/EMPTY INDEX.txt')->first()?->size_bytes)
        ->toBe(0);
});

test('legacy batch manifest rejects files larger than 50 mb', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2025,
        'year_to' => 2025,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/BL COPIES/LARGE SCAN.pdf',
                'size_bytes' => 52_428_801,
                'mime_type' => 'application/pdf',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['files.0.size_bytes']);

    expect($response->json('errors')['files.0.size_bytes'][0])
        ->toBe('Each legacy file must not be larger than 50 MB.');
});

test('admin can append zero-byte files in later manifest chunks', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $createResponse = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2025,
        'year_to' => 2025,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'expected_file_count' => 2,
        'total_size_bytes' => 524288,
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/WORKING PAPERS/ENTRY MONITOR.xlsb',
                'size_bytes' => 524288,
                'mime_type' => 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $batchId = $createResponse->json('data.id');

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batchId}/manifest", [
            'files' => [
                [
                    'relative_path' => 'VESSEL 1/KOTA HAKIM/WORKING PAPERS/EMPTY INDEX.txt',
                    'size_bytes' => 0,
                    'mime_type' => 'text/plain',
                    'modified_at' => now()->subYear()->toIso8601String(),
                ],
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.registered_file_count', 2)
        ->assertJsonPath('data.remaining_manifest_files', 0);
});

test('signing uploads returns temporary upload URLs and moves batch to uploading', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
        'status' => LegacyBatchStatus::Draft,
        'expected_file_count' => 1,
    ]);

    $batch->files()->create([
        'relative_path' => $batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'storage_path' => 'legacy-batches/'.$batch->uuid.'/'.$batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'filename' => 'IMPORT ENTRY.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 100000,
        'status' => LegacyBatchFileStatus::Pending,
    ]);

    $response = $this->actingAs($admin)->postJson("/api/legacy-batches/{$batch->uuid}/files/sign", [
        'relative_paths' => [$batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf'],
    ]);

    $response->assertOk()
        ->assertJsonPath('data.batch_id', $batch->uuid)
        ->assertJsonPath('data.status', LegacyBatchStatus::Uploading->value)
        ->assertJsonCount(1, 'data.uploads');

    $batch->refresh();

    expect($batch->status)->toBe(LegacyBatchStatus::Uploading);
});

test('signing uploads is blocked until the full manifest is registered', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->postJson('/api/legacy-batches', [
        'batch_name' => 'VESSEL 1 — Historical Archive',
        'root_folder' => 'VESSEL 1',
        'year_from' => 2025,
        'year_to' => 2025,
        'department' => 'Brokerage',
        'notes' => 'Historical vessel archive preserved for retrieval.',
        'expected_file_count' => 2,
        'total_size_bytes' => 624288,
        'files' => [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf',
                'size_bytes' => 524288,
                'mime_type' => 'application/pdf',
                'modified_at' => now()->subYear()->toIso8601String(),
            ],
        ],
    ]);

    $batchId = $response->json('data.id');

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batchId}/files/sign", [
            'relative_paths' => ['VESSEL 1/KOTA HAKIM/IMPORT ENTRY.pdf'],
        ])
        ->assertStatus(409)
        ->assertSeeText('The legacy batch manifest is incomplete. Finish registering the selected files before uploads begin.');
});

test('completing uploaded files and finalizing a legacy batch marks it complete', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
        'expected_file_count' => 2,
        'total_size_bytes' => 744288,
    ]);

    $files = collect([
        [
            'relative_path' => $batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
            'storage_path' => 'legacy-batches/'.$batch->uuid.'/'.$batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
            'filename' => 'IMPORT ENTRY.pdf',
            'size_bytes' => 524288,
        ],
        [
            'relative_path' => $batch->root_folder.'/ED CANCELLATION/NOTICE.pdf',
            'storage_path' => 'legacy-batches/'.$batch->uuid.'/'.$batch->root_folder.'/ED CANCELLATION/NOTICE.pdf',
            'filename' => 'NOTICE.pdf',
            'size_bytes' => 220000,
        ],
    ])->map(fn (array $file) => $batch->files()->create([
        ...$file,
        'mime_type' => 'application/pdf',
        'status' => LegacyBatchFileStatus::Pending,
    ]));

    foreach ($files as $file) {
        Storage::disk($this->documentDisk)->put($file->storage_path, 'legacy');
    }

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batch->uuid}/files/complete", [
            'relative_paths' => $files->pluck('relative_path')->all(),
        ])
        ->assertOk()
        ->assertJsonPath('data.uploaded_file_count', 2);

    $response = $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batch->uuid}/finalize")
        ->assertOk();

    $response
        ->assertJsonPath('data.status', LegacyBatchStatus::Completed->value)
        ->assertJsonPath('data.upload_summary.remaining', 0)
        ->assertJsonPath('data.tree.name', $batch->root_folder);

    $batch->refresh();

    expect($batch->status)->toBe(LegacyBatchStatus::Completed);
});

test('finalizing an incomplete legacy batch marks it interrupted so it can resume later', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
        'expected_file_count' => 2,
    ]);

    $uploadedFile = $batch->files()->create([
        'relative_path' => $batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'storage_path' => 'legacy-batches/'.$batch->uuid.'/'.$batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'filename' => 'IMPORT ENTRY.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 100000,
        'status' => LegacyBatchFileStatus::Pending,
    ]);

    $batch->files()->create([
        'relative_path' => $batch->root_folder.'/KOTA HAKIM/BL COPY.pdf',
        'storage_path' => 'legacy-batches/'.$batch->uuid.'/'.$batch->root_folder.'/KOTA HAKIM/BL COPY.pdf',
        'filename' => 'BL COPY.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 80000,
        'status' => LegacyBatchFileStatus::Pending,
    ]);

    Storage::disk($this->documentDisk)->put($uploadedFile->storage_path, 'legacy');

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batch->uuid}/files/complete", [
            'relative_paths' => [$uploadedFile->relative_path],
        ])
        ->assertOk();

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batch->uuid}/finalize")
        ->assertOk()
        ->assertJsonPath('data.status', LegacyBatchStatus::Interrupted->value)
        ->assertJsonPath('data.upload_summary.remaining', 1)
        ->assertJsonPath('data.can_resume', true)
        ->assertJsonPath('data.remaining_relative_paths.0', $batch->root_folder.'/KOTA HAKIM/BL COPY.pdf');
});

test('finalizing a batch before any file completes still keeps it interrupted for resume', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
        'expected_file_count' => 1,
    ]);

    $batch->files()->create([
        'relative_path' => $batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'storage_path' => 'legacy-batches/'.$batch->uuid.'/'.$batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'filename' => 'IMPORT ENTRY.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 100000,
        'status' => LegacyBatchFileStatus::Pending,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/legacy-batches/{$batch->uuid}/finalize")
        ->assertOk()
        ->assertJsonPath('data.status', LegacyBatchStatus::Interrupted->value)
        ->assertJsonPath('data.upload_summary.remaining', 1)
        ->assertJsonPath('data.can_resume', true);
});

test('interrupted legacy batches can be deleted from storage and database', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
        'status' => LegacyBatchStatus::Interrupted,
        'expected_file_count' => 1,
    ]);

    $file = $batch->files()->create([
        'relative_path' => $batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'storage_path' => 'legacy-batches/'.$batch->uuid.'/'.$batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'filename' => 'IMPORT ENTRY.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 100000,
        'status' => LegacyBatchFileStatus::Failed,
        'failed_at' => now(),
    ]);

    Storage::disk($this->documentDisk)->put($file->storage_path, 'orphaned');
    Storage::disk($this->documentDisk)->put('legacy-batches/'.$batch->uuid.'/stray/orphan.txt', 'stray');

    AuditLog::query()->create([
        'auditable_type' => LegacyBatch::class,
        'auditable_id' => $batch->id,
        'user_id' => $admin->id,
        'event' => 'created',
        'new_values' => ['batch_name' => $batch->batch_name],
        'ip_address' => '127.0.0.1',
    ]);
    AuditLog::query()->create([
        'auditable_type' => LegacyBatchFile::class,
        'auditable_id' => $file->id,
        'user_id' => $admin->id,
        'event' => 'created',
        'new_values' => ['filename' => $file->filename],
        'ip_address' => '127.0.0.1',
    ]);

    $this->actingAs($admin)
        ->deleteJson("/api/legacy-batches/{$batch->uuid}")
        ->assertNoContent();

    expect(LegacyBatch::query()->whereKey($batch->id)->exists())->toBeFalse();
    expect(Storage::disk($this->documentDisk)->exists($file->storage_path))->toBeFalse();
    expect(Storage::disk($this->documentDisk)->exists('legacy-batches/'.$batch->uuid.'/stray/orphan.txt'))->toBeFalse();
    $this->assertDatabaseMissing('legacy_batch_files', ['id' => $file->id]);
    expect(AuditLog::query()->where('auditable_type', LegacyBatch::class)->where('auditable_id', $batch->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', LegacyBatchFile::class)->where('auditable_id', $file->id)->exists())->toBeFalse();
});

test('completed legacy batches cannot be deleted', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
        'status' => LegacyBatchStatus::Completed,
    ]);

    $this->actingAs($admin)
        ->deleteJson("/api/legacy-batches/{$batch->uuid}")
        ->assertStatus(409)
        ->assertSeeText('Only incomplete legacy batches can be deleted.');
});

test('authorized users can download uploaded legacy batch files', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
    ]);

    $file = $batch->files()->create([
        'relative_path' => $batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'storage_path' => 'legacy-batches/'.$batch->uuid.'/'.$batch->root_folder.'/KOTA HAKIM/IMPORT ENTRY.pdf',
        'filename' => 'IMPORT ENTRY.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 100000,
        'status' => LegacyBatchFileStatus::Uploaded,
        'uploaded_at' => now(),
    ]);

    Storage::disk($this->documentDisk)->put($file->storage_path, 'legacy');

    $this->actingAs($admin)
        ->get("/api/legacy-batches/{$batch->uuid}/files/{$file->id}/download")
        ->assertOk()
        ->assertHeader('content-disposition');
});
