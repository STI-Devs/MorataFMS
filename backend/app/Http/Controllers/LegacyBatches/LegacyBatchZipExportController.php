<?php

namespace App\Http\Controllers\LegacyBatches;

use App\Http\Controllers\Controller;
use App\Http\Requests\LegacyBatches\LegacyBatchZipExportIndexRequest;
use App\Http\Resources\LegacyBatches\LegacyBatchZipExportResource;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchZipExport;
use App\Orchestrators\LegacyBatches\LegacyBatchOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegacyBatchZipExportController extends Controller
{
    public function __construct(
        private LegacyBatchOrchestrator $legacyBatches,
    ) {}

    public function index(LegacyBatchZipExportIndexRequest $request): AnonymousResourceCollection
    {
        $this->legacyBatches->authorizeZipExportIndex($request->user());

        return LegacyBatchZipExportResource::collection(
            $this->legacyBatches->zipExports($request, $request->user()),
        );
    }

    public function store(Request $request, LegacyBatch $legacyBatch): JsonResponse
    {
        $this->legacyBatches->authorizeZipExport($request->user(), $legacyBatch);

        return (new LegacyBatchZipExportResource(
            $this->legacyBatches->storeZipExport($legacyBatch, $request->user()),
        ))->response()->setStatusCode(202);
    }

    public function retry(Request $request, LegacyBatchZipExport $legacyBatchZipExport): JsonResponse
    {
        $this->legacyBatches->authorizeZipExportAccess($request->user(), $legacyBatchZipExport);

        return (new LegacyBatchZipExportResource(
            $this->legacyBatches->retryZipExport($legacyBatchZipExport),
        ))->response()->setStatusCode(202);
    }

    public function download(Request $request, LegacyBatchZipExport $legacyBatchZipExport): StreamedResponse
    {
        $this->legacyBatches->authorizeZipExportAccess($request->user(), $legacyBatchZipExport);

        return $this->legacyBatches->downloadZipExport($legacyBatchZipExport);
    }

    public function destroy(Request $request, LegacyBatchZipExport $legacyBatchZipExport): Response
    {
        $this->legacyBatches->authorizeZipExportAccess($request->user(), $legacyBatchZipExport);
        $this->legacyBatches->deleteZipExport($legacyBatchZipExport);

        return response()->noContent();
    }
}
