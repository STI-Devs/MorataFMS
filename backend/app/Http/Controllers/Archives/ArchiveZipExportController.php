<?php

namespace App\Http\Controllers\Archives;

use App\Http\Controllers\Controller;
use App\Http\Requests\Archives\ArchiveZipExportIndexRequest;
use App\Http\Requests\Archives\StoreArchiveZipExportRequest;
use App\Http\Resources\Archives\ArchiveZipExportResource;
use App\Models\ArchiveZipExport;
use App\Orchestrators\Archives\ArchiveOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ArchiveZipExportController extends Controller
{
    public function __construct(
        private ArchiveOrchestrator $archives,
    ) {}

    public function index(ArchiveZipExportIndexRequest $request): AnonymousResourceCollection
    {
        return ArchiveZipExportResource::collection(
            $this->archives->zipExports($request->filters(), $request->user()),
        );
    }

    public function store(StoreArchiveZipExportRequest $request): JsonResponse
    {
        $data = $request->zipExportData();
        $this->archives->assertCanIndex($request->user(), $data->mine);

        return (new ArchiveZipExportResource(
            $this->archives->storeZipExport($request->user(), $data),
        ))->response()->setStatusCode(202);
    }

    public function retry(Request $request, ArchiveZipExport $archiveZipExport): JsonResponse
    {
        $this->archives->assertCanAccessZipExport($request->user(), $archiveZipExport);

        return (new ArchiveZipExportResource(
            $this->archives->retryZipExport($archiveZipExport),
        ))->response()->setStatusCode(202);
    }

    public function download(Request $request, ArchiveZipExport $archiveZipExport): StreamedResponse
    {
        $this->archives->assertCanAccessZipExport($request->user(), $archiveZipExport);

        return $this->archives->downloadZipExport($archiveZipExport);
    }

    public function destroy(Request $request, ArchiveZipExport $archiveZipExport): Response
    {
        $this->archives->assertCanAccessZipExport($request->user(), $archiveZipExport);
        $this->archives->deleteZipExport($archiveZipExport);

        return response()->noContent();
    }
}
