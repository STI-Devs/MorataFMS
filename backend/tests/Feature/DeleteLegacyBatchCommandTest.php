<?php

use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchStatus;
use App\Models\AuditLog;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config(['filesystems.document_disk' => 's3']);
    Storage::fake('s3');
});

test('ops delete legacy batch dry run reports orphaned storage without deleting anything', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
        'status' => LegacyBatchStatus::Completed,
        'storage_disk' => 's3',
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

    Storage::disk('s3')->put($file->storage_path, 'legacy');
    Storage::disk('s3')->put('legacy-batches/'.$batch->uuid.'/stray/orphan.txt', 'stray');

    $this->artisan('ops:delete-legacy-batch', [
        'uuid' => $batch->uuid,
        '--dry-run' => true,
    ])
        ->expectsOutputToContain('Database file count: 1')
        ->expectsOutputToContain('Storage object count: 2')
        ->expectsOutputToContain('Orphan storage object count: 1')
        ->expectsOutputToContain('Dry run only. No data was deleted.')
        ->assertSuccessful();

    expect(LegacyBatch::query()->whereKey($batch->id)->exists())->toBeTrue();
    expect(Storage::disk('s3')->exists($file->storage_path))->toBeTrue();
    expect(Storage::disk('s3')->exists('legacy-batches/'.$batch->uuid.'/stray/orphan.txt'))->toBeTrue();
});

test('ops delete legacy batch removes database rows audit logs and stray storage objects', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'uploaded_by' => $admin->id,
        'status' => LegacyBatchStatus::Completed,
        'storage_disk' => 's3',
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

    Storage::disk('s3')->put($file->storage_path, 'legacy');
    Storage::disk('s3')->put('legacy-batches/'.$batch->uuid.'/stray/orphan.txt', 'stray');

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

    $this->artisan('ops:delete-legacy-batch', [
        'uuid' => $batch->uuid,
        '--force' => true,
    ])
        ->expectsOutputToContain("Deletion complete for legacy batch [{$batch->uuid}].")
        ->expectsOutputToContain('Deleted storage object count: 2')
        ->expectsOutputToContain('Deleted file record count: 1')
        ->expectsOutputToContain('Deleted batch count: 1')
        ->expectsOutputToContain('Deleted audit log count: 4')
        ->assertSuccessful();

    expect(LegacyBatch::query()->whereKey($batch->id)->exists())->toBeFalse();
    expect(LegacyBatchFile::query()->whereKey($file->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', LegacyBatch::class)->where('auditable_id', $batch->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', LegacyBatchFile::class)->where('auditable_id', $file->id)->exists())->toBeFalse();
    expect(Storage::disk('s3')->exists($file->storage_path))->toBeFalse();
    expect(Storage::disk('s3')->exists('legacy-batches/'.$batch->uuid.'/stray/orphan.txt'))->toBeFalse();
});
