<?php

namespace App\Actions\LegacyBatches;

use App\Enums\LegacyBatchStatus;
use App\Models\LegacyBatch;
use App\Queries\LegacyBatches\LegacyBatchDetailQuery;

class FinalizeLegacyBatch
{
    public function __construct(private LegacyBatchDetailQuery $legacyBatchDetailQuery) {}

    public function handle(LegacyBatch $legacyBatch): LegacyBatch
    {
        $legacyBatch->syncProgressCounts()->refresh();

        $status = match (true) {
            $legacyBatch->uploaded_file_count === $legacyBatch->expected_file_count => LegacyBatchStatus::Completed,
            $legacyBatch->expected_file_count > 0 => LegacyBatchStatus::Interrupted,
            default => LegacyBatchStatus::Failed,
        };

        $legacyBatch->forceFill([
            'status' => $status,
            'completed_at' => $status === LegacyBatchStatus::Completed ? now() : null,
            'last_activity_at' => now(),
        ])->save();

        return $this->legacyBatchDetailQuery->handle($legacyBatch);
    }
}
