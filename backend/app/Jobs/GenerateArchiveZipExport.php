<?php

namespace App\Jobs;

use App\Enums\ArchiveZipExportStatus;
use App\Models\ArchiveZipExport;
use App\Support\Archives\ArchiveFolderZipBuilder;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Str;
use Throwable;

class GenerateArchiveZipExport implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 900;

    /**
     * @var list<int>
     */
    public array $backoff = [30, 120, 300];

    public int $uniqueFor = 3600;

    public function __construct(
        public int $archiveZipExportId,
    ) {}

    public function uniqueId(): string
    {
        return (string) $this->archiveZipExportId;
    }

    public function handle(ArchiveFolderZipBuilder $archiveFolderZipBuilder): void
    {
        $archiveZipExport = ArchiveZipExport::query()
            ->with('requestedBy')
            ->find($this->archiveZipExportId);

        if (! $archiveZipExport instanceof ArchiveZipExport) {
            return;
        }

        if (! in_array($archiveZipExport->status, [
            ArchiveZipExportStatus::Pending,
            ArchiveZipExportStatus::Processing,
        ], true)) {
            return;
        }

        if ($archiveZipExport->isExpired()) {
            $archiveZipExport->forceFill([
                'status' => ArchiveZipExportStatus::Expired,
                'completed_at' => now(),
                'error_message' => 'ZIP request expired before it could be prepared.',
            ])->save();

            return;
        }

        $archiveZipExport->forceFill([
            'status' => ArchiveZipExportStatus::Processing,
            'started_at' => $archiveZipExport->started_at ?? now(),
            'error_message' => null,
        ])->save();

        try {
            $statistics = $archiveFolderZipBuilder->store($archiveZipExport);

            $archiveZipExport->forceFill([
                'status' => ArchiveZipExportStatus::Ready,
                'file_size_bytes' => $statistics['file_size_bytes'],
                'file_count' => $statistics['file_count'],
                'bl_count' => $statistics['bl_count'],
                'error_message' => null,
                'completed_at' => now(),
            ])->save();
        } catch (Throwable $exception) {
            $archiveZipExport->forceFill([
                'error_message' => Str::limit($exception->getMessage(), 1000),
            ])->save();

            throw $exception;
        }
    }

    public function failed(?Throwable $exception): void
    {
        $archiveZipExport = ArchiveZipExport::query()->find($this->archiveZipExportId);

        if (! $archiveZipExport instanceof ArchiveZipExport) {
            return;
        }

        $archiveZipExport->forceFill([
            'status' => ArchiveZipExportStatus::Failed,
            'completed_at' => now(),
            'error_message' => $exception ? Str::limit($exception->getMessage(), 1000) : 'ZIP preparation failed.',
        ])->save();
    }
}
