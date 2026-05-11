<?php

namespace App\Orchestrators\LegacyBatches;

use App\Actions\LegacyBatches\AppendLegacyBatchManifest;
use App\Actions\LegacyBatches\CompleteLegacyBatchUploads;
use App\Actions\LegacyBatches\CreateLegacyBatch;
use App\Actions\LegacyBatches\DeleteLegacyBatch;
use App\Actions\LegacyBatches\FinalizeLegacyBatch;
use App\Actions\LegacyBatches\SignLegacyBatchUploads;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Models\User;
use App\Queries\LegacyBatches\LegacyBatchDetailQuery;
use App\Queries\LegacyBatches\LegacyBatchIndexQuery;
use App\Support\LegacyBatches\LegacyBatchAuthorizer;
use App\Support\LegacyBatches\LegacyBatchFileDownloader;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegacyBatchOrchestrator
{
    public function __construct(
        private LegacyBatchAuthorizer $legacyBatchAuthorizer,
        private LegacyBatchIndexQuery $legacyBatchIndexQuery,
        private LegacyBatchDetailQuery $legacyBatchDetailQuery,
        private CreateLegacyBatch $createLegacyBatch,
        private AppendLegacyBatchManifest $appendLegacyBatchManifest,
        private SignLegacyBatchUploads $signLegacyBatchUploads,
        private CompleteLegacyBatchUploads $completeLegacyBatchUploads,
        private FinalizeLegacyBatch $finalizeLegacyBatch,
        private DeleteLegacyBatch $deleteLegacyBatch,
        private LegacyBatchFileDownloader $legacyBatchFileDownloader,
    ) {}

    public function authorizeAccess(User $user): void
    {
        $this->legacyBatchAuthorizer->authorizeAccess($user);
    }

    public function authorizeVisibility(User $user, LegacyBatch $legacyBatch): void
    {
        $this->legacyBatchAuthorizer->authorizeVisibility($user, $legacyBatch);
    }

    public function index(Request $request, User $user): LengthAwarePaginator
    {
        return $this->legacyBatchIndexQuery->handle($request, $user);
    }

    public function store(array $validated, User $user): LegacyBatch
    {
        $batch = $this->createLegacyBatch->handle($validated, $user);

        return $this->legacyBatchDetailQuery->handle($batch);
    }

    public function appendManifest(LegacyBatch $legacyBatch, array $files): int
    {
        return $this->appendLegacyBatchManifest->handle($legacyBatch, $files);
    }

    public function show(LegacyBatch $legacyBatch): LegacyBatch
    {
        return $this->legacyBatchDetailQuery->handle($legacyBatch);
    }

    public function signUploads(LegacyBatch $legacyBatch, array $relativePaths): Collection
    {
        return $this->signLegacyBatchUploads->handle($legacyBatch, $relativePaths);
    }

    public function completeUploads(LegacyBatch $legacyBatch, array $relativePaths): LegacyBatch
    {
        return $this->completeLegacyBatchUploads->handle($legacyBatch, $relativePaths);
    }

    public function finalize(LegacyBatch $legacyBatch): LegacyBatch
    {
        return $this->finalizeLegacyBatch->handle($legacyBatch);
    }

    public function delete(LegacyBatch $legacyBatch): void
    {
        $this->deleteLegacyBatch->handle($legacyBatch);
    }

    public function downloadFile(LegacyBatch $legacyBatch, LegacyBatchFile $legacyBatchFile): StreamedResponse
    {
        return $this->legacyBatchFileDownloader->download($legacyBatch, $legacyBatchFile);
    }
}
