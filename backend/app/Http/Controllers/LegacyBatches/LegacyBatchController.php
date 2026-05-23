<?php

namespace App\Http\Controllers\LegacyBatches;

use App\Enums\LegacyBatchModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\LegacyBatches\AppendLegacyBatchManifestRequest;
use App\Http\Requests\LegacyBatches\CompleteLegacyBatchUploadsRequest;
use App\Http\Requests\LegacyBatches\FinalizeLegacyBatchRequest;
use App\Http\Requests\LegacyBatches\SignLegacyBatchUploadsRequest;
use App\Http\Requests\LegacyBatches\StoreLegacyBatchRequest;
use App\Http\Resources\LegacyBatches\LegacyBatchDetailResource;
use App\Http\Resources\LegacyBatches\LegacyBatchResource;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Orchestrators\LegacyBatches\LegacyBatchOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegacyBatchController extends Controller
{
    public function __construct(
        private LegacyBatchOrchestrator $legacyBatches,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $module = $this->moduleFromRequest($request);
        $this->legacyBatches->authorizeAccess($user, $module?->value);
        $batches = $this->legacyBatches->index($request, $user);

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
        $data = $request->legacyBatchData();
        $this->legacyBatches->authorizeAccess($user, $data->module->value);

        return (new LegacyBatchDetailResource(
            $this->legacyBatches->store($data, $user)
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function appendManifest(
        AppendLegacyBatchManifestRequest $request,
        LegacyBatch $legacyBatch,
    ): JsonResponse {
        $this->legacyBatches->authorizeVisibility($request->user(), $legacyBatch);
        $registeredFileCount = $this->legacyBatches->appendManifest(
            $legacyBatch,
            $request->manifestData(),
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
        $this->legacyBatches->authorizeVisibility($request->user(), $legacyBatch);

        return new LegacyBatchDetailResource($this->legacyBatches->show($legacyBatch));
    }

    public function signUploads(
        SignLegacyBatchUploadsRequest $request,
        LegacyBatch $legacyBatch,
    ): JsonResponse {
        $this->legacyBatches->authorizeVisibility($request->user(), $legacyBatch);
        $uploads = $this->legacyBatches->signUploads(
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
        $this->legacyBatches->authorizeVisibility($request->user(), $legacyBatch);

        return new LegacyBatchResource(
            $this->legacyBatches->completeUploads(
                $legacyBatch,
                $request->validated()['relative_paths'],
            )
        );
    }

    public function finalize(
        FinalizeLegacyBatchRequest $request,
        LegacyBatch $legacyBatch,
    ): LegacyBatchDetailResource {
        $this->legacyBatches->authorizeVisibility($request->user(), $legacyBatch);

        return new LegacyBatchDetailResource($this->legacyBatches->finalize($legacyBatch));
    }

    public function destroy(Request $request, LegacyBatch $legacyBatch): Response
    {
        $this->legacyBatches->authorizeVisibility($request->user(), $legacyBatch);
        $this->legacyBatches->delete($legacyBatch);

        return response()->noContent();
    }

    public function downloadFile(
        Request $request,
        LegacyBatch $legacyBatch,
        LegacyBatchFile $legacyBatchFile,
    ): StreamedResponse {
        $this->legacyBatches->authorizeVisibility($request->user(), $legacyBatch);

        return $this->legacyBatches->downloadFile($legacyBatch, $legacyBatchFile);
    }

    private function moduleFromRequest(Request $request): ?LegacyBatchModule
    {
        $module = $request->query('module');

        if (! is_string($module) || trim($module) === '') {
            return null;
        }

        $resolved = LegacyBatchModule::tryFrom(trim($module));

        if ($resolved === null) {
            abort(422, 'The selected legacy batch module is invalid.');
        }

        return $resolved;
    }
}
