<?php

namespace App\Jobs;

use App\Enums\ArchiveZipExportStatus;
use App\Models\LegacyBatchZipExport;
use App\Support\LegacyBatches\LegacyBatchZipBuilder;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Str;
use Throwable;

class GenerateLegacyBatchZipExport implements ShouldBeUnique, ShouldQueue
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
        public int $legacyBatchZipExportId,
    ) {}

    public function uniqueId(): string
    {
        return (string) $this->legacyBatchZipExportId;
    }

    public function handle(LegacyBatchZipBuilder $legacyBatchZipBuilder): void
    {
        $legacyBatchZipExport = LegacyBatchZipExport::query()
            ->with('legacyBatch')
            ->find($this->legacyBatchZipExportId);

        if (! $legacyBatchZipExport instanceof LegacyBatchZipExport) {
            return;
        }

        if (! in_array($legacyBatchZipExport->status, [
            ArchiveZipExportStatus::Pending,
            ArchiveZipExportStatus::Processing,
        ], true)) {
            return;
        }

        if ($legacyBatchZipExport->isExpired()) {
            $legacyBatchZipExport->forceFill([
                'status' => ArchiveZipExportStatus::Expired,
                'completed_at' => now(),
                'error_message' => 'ZIP request expired before it could be prepared.',
            ])->save();

            return;
        }

        $legacyBatchZipExport->forceFill([
            'status' => ArchiveZipExportStatus::Processing,
            'started_at' => $legacyBatchZipExport->started_at ?? now(),
            'error_message' => null,
        ])->save();

        try {
            $statistics = $legacyBatchZipBuilder->store($legacyBatchZipExport);

            $legacyBatchZipExport->forceFill([
                'status' => ArchiveZipExportStatus::Ready,
                'file_size_bytes' => $statistics['file_size_bytes'],
                'file_count' => $statistics['file_count'],
                'error_message' => null,
                'completed_at' => now(),
            ])->save();
        } catch (Throwable $exception) {
            $legacyBatchZipExport->forceFill([
                'error_message' => Str::limit($exception->getMessage(), 1000),
            ])->save();

            throw $exception;
        }
    }

    public function failed(?Throwable $exception): void
    {
        $legacyBatchZipExport = LegacyBatchZipExport::query()->find($this->legacyBatchZipExportId);

        if (! $legacyBatchZipExport instanceof LegacyBatchZipExport) {
            return;
        }

        $legacyBatchZipExport->forceFill([
            'status' => ArchiveZipExportStatus::Failed,
            'completed_at' => now(),
            'error_message' => $exception ? Str::limit($exception->getMessage(), 1000) : 'ZIP preparation failed.',
        ])->save();
    }
}
