<?php

namespace Database\Factories;

use App\Enums\ArchiveZipExportScope;
use App\Enums\ArchiveZipExportStatus;
use App\Models\ArchiveZipExport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ArchiveZipExport>
 */
class ArchiveZipExportFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'requested_by' => User::factory(),
            'scope' => ArchiveZipExportScope::Folder,
            'year' => now()->year,
            'month' => now()->month,
            'type' => 'export',
            'mine' => false,
            'status' => ArchiveZipExportStatus::Pending,
            'storage_disk' => (string) config('filesystems.default', 'local'),
            'file_path' => null,
            'filename' => 'archive-folder.zip',
            'file_size_bytes' => 0,
            'file_count' => 0,
            'bl_count' => 0,
            'error_message' => null,
            'started_at' => null,
            'completed_at' => null,
            'expires_at' => now()->addHours(ArchiveZipExport::EXPIRATION_HOURS),
        ];
    }

    public function ready(): self
    {
        return $this->state(fn () => [
            'status' => ArchiveZipExportStatus::Ready,
            'file_path' => 'archive-zip-exports/test/archive-folder.zip',
            'file_size_bytes' => 1024,
            'file_count' => 2,
            'bl_count' => 1,
            'completed_at' => now(),
        ]);
    }

    public function failed(): self
    {
        return $this->state(fn () => [
            'status' => ArchiveZipExportStatus::Failed,
            'error_message' => 'ZIP preparation failed.',
            'completed_at' => now(),
        ]);
    }
}
