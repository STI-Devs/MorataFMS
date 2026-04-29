<?php

namespace App\Actions\LegacyBatches;

use App\Enums\LegacyBatchStatus;
use App\Models\LegacyBatch;
use App\Support\LegacyBatches\LegacyBatchDeletionExecutor;

class DeleteLegacyBatch
{
    public function __construct(private LegacyBatchDeletionExecutor $legacyBatchDeletionExecutor) {}

    public function handle(LegacyBatch $legacyBatch): void
    {
        if (! in_array($legacyBatch->status, [
            LegacyBatchStatus::Draft,
            LegacyBatchStatus::Interrupted,
            LegacyBatchStatus::Failed,
        ], true)) {
            abort(409, 'Only incomplete legacy batches can be deleted.');
        }

        $result = $this->legacyBatchDeletionExecutor->delete($legacyBatch);

        if ($result['failed_file_deletions'] !== []) {
            abort(500, 'The legacy batch files could not be removed from storage.');
        }
    }
}
