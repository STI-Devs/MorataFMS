<?php

namespace App\Http\Controllers;

use App\Actions\LegacyBatches\AppendLegacyBatchManifest;
use App\Actions\LegacyBatches\CompleteLegacyBatchUploads;
use App\Actions\LegacyBatches\CreateLegacyBatch;
use App\Actions\LegacyBatches\DeleteLegacyBatch;
use App\Actions\LegacyBatches\FinalizeLegacyBatch;
use App\Actions\LegacyBatches\SignLegacyBatchUploads;
use App\Http\Requests\AppendLegacyBatchManifestRequest;
use App\Http\Requests\CompleteLegacyBatchUploadsRequest;
use App\Http\Requests\FinalizeLegacyBatchRequest;
use App\Http\Requests\SignLegacyBatchUploadsRequest;
use App\Http\Requests\StoreLegacyBatchRequest;
use App\Http\Resources\LegacyBatchDetailResource;
use App\Http\Resources\LegacyBatchResource;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Queries\LegacyBatches\LegacyBatchDetailQuery;
use App\Queries\LegacyBatches\LegacyBatchIndexQuery;
use App\Support\LegacyBatches\LegacyBatchAuthorizer;
use App\Support\LegacyBatches\LegacyBatchFileDownloader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegacyBatchController extends Controller
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

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->legacyBatchAuthorizer->authorizeAccess($user);
        $batches = $this->legacyBatchIndexQuery->handle($request, $user);

        return response()->json([
            'data' => LegacyBatchResource::collection($batches->items())->resolve($request),
            'meta' => [
                'current_page' => $batches->currentPage(),
                'per_page' => $batches->perPage(),
                'total' => $batches->total(),
                'last_page' => $batches->lastPage(),
                'from' => $batches->firstItem(),
                'to' => $batches->lastItem(),
            ],
        ]);
    }

    public function store(StoreLegacyBatchRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->legacyBatchAuthorizer->authorizeAccess($user);
        $batch = $this->createLegacyBatch->handle($request->validated(), $user);
        $batch = $this->legacyBatchDetailQuery->handle($batch);

        return (new LegacyBatchDetailResource($batch))
            ->response()
            ->setStatusCode(201);
    }

    public function appendManifest(
        AppendLegacyBatchManifestRequest $request,
        LegacyBatch $legacyBatch,
    ): JsonResponse {
        $this->legacyBatchAuthorizer->authorizeVisibility($request->user(), $legacyBatch);
        $registeredFileCount = $this->appendLegacyBatchManifest->handle(
            $legacyBatch,
            $request->validated()['files'],
        );

        return response()->json([
            'data' => [
                'batch_id' => $legacyBatch->uuid,
                'registered_file_count' => $registeredFileCount,
                'expected_file_count' => $legacyBatch->expected_file_count,
                'remaining_manifest_files' => max($legacyBatch->expected_file_count - $registeredFileCount, 0),
            ],
        ]);
    }

    public function show(Request $request, LegacyBatch $legacyBatch): LegacyBatchDetailResource
    {
        $this->legacyBatchAuthorizer->authorizeVisibility($request->user(), $legacyBatch);
        $legacyBatch = $this->legacyBatchDetailQuery->handle($legacyBatch);

        return new LegacyBatchDetailResource($legacyBatch);
    }

    public function signUploads(
        SignLegacyBatchUploadsRequest $request,
        LegacyBatch $legacyBatch,
    ): JsonResponse {
        $this->legacyBatchAuthorizer->authorizeVisibility($request->user(), $legacyBatch);
        $uploads = $this->signLegacyBatchUploads->handle(
            $legacyBatch,
            $request->validated()['relative_paths'],
        );

        return response()->json([
            'data' => [
                'batch_id' => $legacyBatch->uuid,
                'status' => $legacyBatch->status->value,
                'uploads' => $uploads,
            ],
        ]);
    }

    public function completeUploads(
        CompleteLegacyBatchUploadsRequest $request,
        LegacyBatch $legacyBatch,
    ): LegacyBatchResource {
        $this->legacyBatchAuthorizer->authorizeVisibility($request->user(), $legacyBatch);
        $legacyBatch = $this->completeLegacyBatchUploads->handle(
            $legacyBatch,
            $request->validated()['relative_paths'],
        );

        return new LegacyBatchResource($legacyBatch);
    }

    public function finalize(
        FinalizeLegacyBatchRequest $request,
        LegacyBatch $legacyBatch,
    ): LegacyBatchDetailResource {
        $this->legacyBatchAuthorizer->authorizeVisibility($request->user(), $legacyBatch);
        $legacyBatch = $this->finalizeLegacyBatch->handle($legacyBatch);

        return new LegacyBatchDetailResource($legacyBatch);
    }

    public function destroy(Request $request, LegacyBatch $legacyBatch): Response
    {
        $this->legacyBatchAuthorizer->authorizeVisibility($request->user(), $legacyBatch);
        $this->deleteLegacyBatch->handle($legacyBatch);

        return response()->noContent();
    }

    public function downloadFile(
        Request $request,
        LegacyBatch $legacyBatch,
        LegacyBatchFile $legacyBatchFile,
    ): StreamedResponse {
        $this->legacyBatchAuthorizer->authorizeVisibility($request->user(), $legacyBatch);

        return $this->legacyBatchFileDownloader->download($legacyBatch, $legacyBatchFile);
    }
}
