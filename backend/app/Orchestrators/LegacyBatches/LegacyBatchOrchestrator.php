<?php

namespace App\Orchestrators\LegacyBatches;

use App\Actions\LegacyBatches\AppendLegacyBatchManifest;
use App\Actions\LegacyBatches\CompleteLegacyBatchUploads;
use App\Actions\LegacyBatches\CreateLegacyBatch;
use App\Actions\LegacyBatches\CreateLegacyBatchZipExport;
use App\Actions\LegacyBatches\DeleteLegacyBatch;
use App\Actions\LegacyBatches\DeleteLegacyBatchZipExport;
use App\Actions\LegacyBatches\FinalizeLegacyBatch;
use App\Actions\LegacyBatches\RetryLegacyBatchZipExport;
use App\Actions\LegacyBatches\SignLegacyBatchUploads;
use App\Http\Requests\LegacyBatches\LegacyBatchZipExportIndexRequest;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Models\LegacyBatchZipExport;
use App\Models\User;
use App\Queries\LegacyBatches\LegacyBatchDetailQuery;
use App\Queries\LegacyBatches\LegacyBatchIndexQuery;
use App\Queries\LegacyBatches\LegacyBatchZipExportIndexQuery;
use App\Support\LegacyBatches\LegacyBatchAuthorizer;
use App\Support\LegacyBatches\LegacyBatchFileDownloader;
use App\Support\LegacyBatches\LegacyBatchZipExportDownloader;
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
        private LegacyBatchZipExportIndexQuery $legacyBatchZipExportIndexQuery,
        private CreateLegacyBatch $createLegacyBatch,
        private CreateLegacyBatchZipExport $createLegacyBatchZipExport,
        private AppendLegacyBatchManifest $appendLegacyBatchManifest,
        private SignLegacyBatchUploads $signLegacyBatchUploads,
        private CompleteLegacyBatchUploads $completeLegacyBatchUploads,
        private FinalizeLegacyBatch $finalizeLegacyBatch,
        private DeleteLegacyBatch $deleteLegacyBatch,
        private RetryLegacyBatchZipExport $retryLegacyBatchZipExport,
        private DeleteLegacyBatchZipExport $deleteLegacyBatchZipExport,
        private LegacyBatchFileDownloader $legacyBatchFileDownloader,
        private LegacyBatchZipExportDownloader $legacyBatchZipExportDownloader,
    ) {}

    public function authorizeAccess(User $user, ?string $module = null): void
    {
        $this->legacyBatchAuthorizer->authorizeAccess($user, $module);
    }

    public function authorizeVisibility(User $user, LegacyBatch $legacyBatch): void
    {
        $this->legacyBatchAuthorizer->authorizeVisibility($user, $legacyBatch);
    }

    public function authorizeZipExportIndex(User $user): void
    {
        $this->legacyBatchAuthorizer->authorizeZipExportIndex($user);
    }

    public function authorizeZipExport(User $user, LegacyBatch $legacyBatch): void
    {
        $this->legacyBatchAuthorizer->authorizeZipExport($user, $legacyBatch);
    }

    public function authorizeZipExportAccess(User $user, LegacyBatchZipExport $legacyBatchZipExport): void
    {
        $this->legacyBatchAuthorizer->authorizeZipExportAccess($user, $legacyBatchZipExport);
    }

    public function index(Request $request, User $user): LengthAwarePaginator
    {
        return $this->legacyBatchIndexQuery->handle($request, $user);
    }

    /**
     * @return LengthAwarePaginator<int, LegacyBatchZipExport>
     */
    public function zipExports(LegacyBatchZipExportIndexRequest $request, User $user): LengthAwarePaginator
    {
        return $this->legacyBatchZipExportIndexQuery->handle($request, $user);
    }

    public function store(array $validated, User $user): LegacyBatch
    {
        $batch = $this->createLegacyBatch->handle($validated, $user);

        return $this->legacyBatchDetailQuery->handle($batch);
    }

    public function storeZipExport(LegacyBatch $legacyBatch, User $user): LegacyBatchZipExport
    {
        return $this->createLegacyBatchZipExport->handle($legacyBatch, $user);
    }

    public function retryZipExport(LegacyBatchZipExport $legacyBatchZipExport): LegacyBatchZipExport
    {
        return $this->retryLegacyBatchZipExport->handle($legacyBatchZipExport);
    }

    public function downloadZipExport(LegacyBatchZipExport $legacyBatchZipExport): StreamedResponse
    {
        return $this->legacyBatchZipExportDownloader->download($legacyBatchZipExport);
    }

    public function deleteZipExport(LegacyBatchZipExport $legacyBatchZipExport): void
    {
        $this->deleteLegacyBatchZipExport->handle($legacyBatchZipExport);
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
