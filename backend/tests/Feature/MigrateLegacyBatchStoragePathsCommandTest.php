<?php

use App\Console\Commands\Ops\MigrateLegacyBatchStoragePaths;
use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchModule;
use App\Models\LegacyBatch;
use App\Models\User;
use App\Support\LegacyBatches\LegacyBatchUploadUrlFactory;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config(['filesystems.default' => 's3']);
    Storage::fake('s3');
});

test('new legacy batch paths include the module namespace', function () {
    $batch = LegacyBatch::factory()->create([
        'module' => LegacyBatchModule::Legal,
        'storage_disk' => 's3',
    ]);

    $path = app(LegacyBatchUploadUrlFactory::class)->pathFor($batch, 'Client Folder/Document.pdf');

    expect($path)->toBe("legacy-batches/legal/{$batch->uuid}/Client Folder/Document.pdf");
});

test('ops migrate legacy batch storage paths dry run previews legacy object moves', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'module' => LegacyBatchModule::Notarial,
        'uploaded_by' => $admin->id,
        'storage_disk' => 's3',
    ]);
    $oldPath = "legacy-batches/{$batch->uuid}/{$batch->root_folder}/Book 1/Page 1.pdf";
    $newPath = "legacy-batches/notarial/{$batch->uuid}/{$batch->root_folder}/Book 1/Page 1.pdf";

    $file = $batch->files()->create([
        'relative_path' => "{$batch->root_folder}/Book 1/Page 1.pdf",
        'storage_path' => $oldPath,
        'filename' => 'Page 1.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 100000,
        'status' => LegacyBatchFileStatus::Uploaded,
        'uploaded_at' => now(),
    ]);

    Storage::disk('s3')->put($oldPath, 'legacy');

    $this->artisan('ops:migrate-legacy-batch-storage-paths', [
        '--connection' => 'sqlite',
        '--module' => 'notarial',
        '--dry-run' => true,
    ])
        ->expectsOutputToContain('Database connection: sqlite')
        ->expectsOutputToContain('Module filter: notarial')
        ->expectsOutputToContain('Pending file moves: 1')
        ->expectsOutputToContain('Dry run only. No storage objects or database rows were changed.')
        ->assertSuccessful();

    expect(Storage::disk('s3')->exists($oldPath))->toBeTrue();
    expect(Storage::disk('s3')->exists($newPath))->toBeFalse();
    expect($file->fresh()->storage_path)->toBe($oldPath);
});

test('ops migrate legacy batch storage paths moves files and updates database paths', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'module' => LegacyBatchModule::Legal,
        'uploaded_by' => $admin->id,
        'storage_disk' => 's3',
    ]);
    $oldPath = "legacy-batches/{$batch->uuid}/{$batch->root_folder}/Case A/Demand Letter.pdf";
    $newPath = "legacy-batches/legal/{$batch->uuid}/{$batch->root_folder}/Case A/Demand Letter.pdf";

    $file = $batch->files()->create([
        'relative_path' => "{$batch->root_folder}/Case A/Demand Letter.pdf",
        'storage_path' => $oldPath,
        'filename' => 'Demand Letter.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 100000,
        'status' => LegacyBatchFileStatus::Uploaded,
        'uploaded_at' => now(),
    ]);

    Storage::disk('s3')->put($oldPath, 'legacy');

    $this->artisan('ops:migrate-legacy-batch-storage-paths', [
        '--connection' => 'sqlite',
        '--module' => 'legal',
        '--force' => true,
    ])
        ->expectsOutputToContain('Pending file moves: 1')
        ->expectsOutputToContain('Copied files: 1')
        ->expectsOutputToContain('Updated database rows: 1')
        ->expectsOutputToContain('Deleted legacy objects: 1')
        ->expectsOutputToContain('Legacy batch storage path migration complete.')
        ->assertSuccessful();

    expect(Storage::disk('s3')->exists($oldPath))->toBeFalse();
    expect(Storage::disk('s3')->exists($newPath))->toBeTrue();
    expect(Storage::disk('s3')->get($newPath))->toBe('legacy');
    expect($file->fresh()->storage_path)->toBe($newPath);
});

test('ops migrate legacy batch storage paths uses the configured filesystem disk', function () {
    config(['filesystems.default' => 'local']);
    Storage::fake('local');

    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'module' => LegacyBatchModule::Legal,
        'uploaded_by' => $admin->id,
        'storage_disk' => 's3',
    ]);
    $oldPath = "legacy-batches/{$batch->uuid}/{$batch->root_folder}/Case A/Demand Letter.pdf";
    $newPath = "legacy-batches/legal/{$batch->uuid}/{$batch->root_folder}/Case A/Demand Letter.pdf";

    $file = $batch->files()->create([
        'relative_path' => "{$batch->root_folder}/Case A/Demand Letter.pdf",
        'storage_path' => $oldPath,
        'filename' => 'Demand Letter.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 100000,
        'status' => LegacyBatchFileStatus::Uploaded,
        'uploaded_at' => now(),
    ]);

    Storage::disk('local')->put($oldPath, 'legacy');

    $this->artisan('ops:migrate-legacy-batch-storage-paths', [
        '--connection' => 'sqlite',
        '--module' => 'legal',
        '--force' => true,
    ])
        ->expectsOutputToContain('Filesystem disk: local')
        ->expectsOutputToContain('Pending file moves: 1')
        ->expectsOutputToContain('Updated database rows: 1')
        ->expectsOutputToContain('Updated batch disk rows: 1')
        ->assertSuccessful();

    expect(Storage::disk('local')->exists($oldPath))->toBeFalse();
    expect(Storage::disk('local')->exists($newPath))->toBeTrue();
    expect($file->fresh()->storage_path)->toBe($newPath);
    expect($batch->fresh()->storage_disk)->toBe('local');
});

test('ops migrate legacy batch storage paths maps operator connections to the intended storage disk', function () {
    config(['filesystems.default' => 'public']);

    $command = app(MigrateLegacyBatchStoragePaths::class);
    $method = new ReflectionMethod($command, 'resolveStorageDisk');
    $method->setAccessible(true);

    expect($method->invoke($command, 'local'))->toBe('local');
    expect($method->invoke($command, 'production_ops'))->toBe('s3');
    expect($method->invoke($command, 'mysql'))->toBe('public');
});

test('ops migrate legacy batch storage paths rejects production ops when it falls back to the mysql database', function () {
    config([
        'database.connections.mysql.database' => 'morata_fms_prod_mirror',
        'database.connections.production_ops.database' => 'morata_fms_prod_mirror',
    ]);

    $this->artisan('ops:migrate-legacy-batch-storage-paths', [
        '--connection' => 'production_ops',
        '--dry-run' => true,
    ])
        ->expectsOutputToContain('The [production_ops] connection is not configured for a separate production database.')
        ->expectsOutputToContain('Set OPS_DB_HOST, OPS_DB_DATABASE, OPS_DB_USERNAME, and OPS_DB_PASSWORD before using --connection=production_ops.')
        ->assertFailed();
});

test('ops migrate legacy batch storage paths allows production dry run but requires force for mutation', function () {
    $this->app->detectEnvironment(fn () => 'production');

    $this->artisan('ops:migrate-legacy-batch-storage-paths', [
        '--dry-run' => true,
    ])
        ->expectsOutputToContain('Environment: production')
        ->expectsOutputToContain('Dry run only. No storage objects or database rows were changed.')
        ->assertSuccessful();

    $this->artisan('ops:migrate-legacy-batch-storage-paths')
        ->expectsOutputToContain('This command moves legacy batch files in production. Re-run it with --force after reviewing the dry-run output.')
        ->assertFailed();
});

test('ops migrate legacy batch storage paths reports storage configuration failures cleanly', function () {
    config(['filesystems.default' => 'missing-storage-disk']);

    $admin = User::factory()->create(['role' => 'admin']);
    $batch = LegacyBatch::factory()->create([
        'module' => LegacyBatchModule::Legal,
        'uploaded_by' => $admin->id,
        'storage_disk' => 's3',
    ]);

    $batch->files()->create([
        'relative_path' => "{$batch->root_folder}/Case A/Demand Letter.pdf",
        'storage_path' => "legacy-batches/{$batch->uuid}/{$batch->root_folder}/Case A/Demand Letter.pdf",
        'filename' => 'Demand Letter.pdf',
        'mime_type' => 'application/pdf',
        'size_bytes' => 100000,
        'status' => LegacyBatchFileStatus::Uploaded,
        'uploaded_at' => now(),
    ]);

    $this->artisan('ops:migrate-legacy-batch-storage-paths', [
        '--connection' => 'sqlite',
        '--module' => 'legal',
        '--dry-run' => true,
    ])
        ->expectsOutputToContain('Unable to inspect legacy batch storage.')
        ->expectsOutputToContain('Check that the active filesystem disk has valid configuration in this environment.')
        ->assertFailed();
});
