<?php

namespace App\Queries\LegacyBatches;

use App\Models\LegacyBatch;
use App\Support\LegacyBatches\LegacyBatchTreeBuilder;

class LegacyBatchDetailQuery
{
    public function __construct(private LegacyBatchTreeBuilder $legacyBatchTreeBuilder) {}

    public function handle(LegacyBatch $legacyBatch): LegacyBatch
    {
        $legacyBatch->load(['uploadedBy', 'files']);
        $legacyBatch->setAttribute('tree', $this->legacyBatchTreeBuilder->build($legacyBatch));

        return $legacyBatch;
    }
}
