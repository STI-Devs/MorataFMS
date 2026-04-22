<?php

namespace Database\Seeders;

use App\Enums\LegacyBatchFileStatus;
use App\Models\LegacyBatch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class LegacyBatchSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::query()
            ->orderBy('id')
            ->get()
            ->first(fn (User $candidate): bool => in_array($candidate->role?->value, ['admin', 'encoder'], true));

        if (! $user) {
            return;
        }

        $files = [
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/KOTA HAKIM 2350W/BL COPIES/KOTA HAKIM 2350W BL.pdf',
                'filename' => 'KOTA HAKIM 2350W BL.pdf',
                'mime_type' => 'application/pdf',
                'size_bytes' => 524_288,
                'modified_at' => now()->subYear(),
                'status' => LegacyBatchFileStatus::Uploaded,
                'uploaded_at' => now()->subDays(3),
            ],
            [
                'relative_path' => 'VESSEL 1/KOTA HAKIM/KOTA HAKIM 2350W/E-31406/IMPORT ENTRY E-31406.pdf',
                'filename' => 'IMPORT ENTRY E-31406.pdf',
                'mime_type' => 'application/pdf',
                'size_bytes' => 1_655_000,
                'modified_at' => now()->subYear(),
                'status' => LegacyBatchFileStatus::Uploaded,
                'uploaded_at' => now()->subDays(3),
            ],
            [
                'relative_path' => 'VESSEL 1/ED CANCELLATION/ED CANCELLATION NOTICE.pdf',
                'filename' => 'ED CANCELLATION NOTICE.pdf',
                'mime_type' => 'application/pdf',
                'size_bytes' => 220_000,
                'modified_at' => now()->subYear(),
                'status' => LegacyBatchFileStatus::Uploaded,
                'uploaded_at' => now()->subDays(3),
            ],
        ];

        $batch = LegacyBatch::query()->firstOrCreate(
            [
                'batch_name' => 'VESSEL 1 — Historical Archive',
                'root_folder' => 'VESSEL 1',
            ],
            [
                'uuid' => (string) Str::uuid(),
                'year' => 2025,
                'year_from' => 2025,
                'year_to' => 2025,
                'department' => 'Brokerage',
                'notes' => 'Historical vessel archive preserved for retrieval and reference.',
                'status' => 'completed',
                'expected_file_count' => count($files),
                'uploaded_file_count' => count($files),
                'failed_file_count' => 0,
                'total_size_bytes' => collect($files)->sum('size_bytes'),
                'storage_disk' => (string) config('filesystems.default', 'local'),
                'uploaded_by' => $user->id,
                'started_at' => now()->subDays(3),
                'completed_at' => now()->subDays(3),
                'last_activity_at' => now()->subDays(3),
            ],
        );

        $batch->update([
            'expected_file_count' => count($files),
            'uploaded_file_count' => count($files),
            'failed_file_count' => 0,
            'total_size_bytes' => collect($files)->sum('size_bytes'),
            'status' => 'completed',
            'storage_disk' => (string) config('filesystems.default', 'local'),
            'uploaded_by' => $user->id,
        ]);

        $batch->files()->delete();

        $batch->files()->createMany(
            collect($files)->map(function (array $file) use ($batch): array {
                return [
                    ...$file,
                    'storage_path' => 'legacy-batches/'.$batch->uuid.'/'.$file['relative_path'],
                ];
            })->all(),
        );

        foreach ($batch->files as $file) {
            Storage::disk($batch->storage_disk)->put($file->storage_path, 'Seeded legacy batch placeholder for '.$file->filename);
        }
    }
}
