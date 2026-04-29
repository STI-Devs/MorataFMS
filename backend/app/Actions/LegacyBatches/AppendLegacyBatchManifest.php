<?php

namespace App\Actions\LegacyBatches;

use App\Enums\LegacyBatchStatus;
use App\Models\LegacyBatch;
use App\Support\LegacyBatches\LegacyBatchManifestRegistrar;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppendLegacyBatchManifest
{
    public function __construct(private LegacyBatchManifestRegistrar $legacyBatchManifestRegistrar) {}

    public function handle(LegacyBatch $legacyBatch, array $files): int
    {
        if ($legacyBatch->status !== LegacyBatchStatus::Draft) {
            abort(409, 'Legacy batch manifest can only be updated before uploads begin.');
        }

        return DB::transaction(function () use ($legacyBatch, $files): int {
            $this->legacyBatchManifestRegistrar->register($legacyBatch, $files);

            $registeredFileCount = $legacyBatch->files()->count();

            if ($registeredFileCount > $legacyBatch->expected_file_count) {
                throw ValidationException::withMessages([
                    'files' => [
                        'This manifest chunk would register more files than the batch expected when it was created.',
                    ],
                ]);
            }

            $legacyBatch->forceFill([
                'last_activity_at' => now(),
            ])->save();

            return $registeredFileCount;
        });
    }
}
