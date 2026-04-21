<?php

namespace App\Http\Controllers;

use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchStatus;
use App\Http\Requests\CompleteLegacyBatchUploadsRequest;
use App\Http\Requests\FinalizeLegacyBatchRequest;
use App\Http\Requests\SignLegacyBatchUploadsRequest;
use App\Http\Requests\StoreLegacyBatchRequest;
use App\Http\Resources\LegacyBatchDetailResource;
use App\Http\Resources\LegacyBatchResource;
use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use App\Models\User;
use App\Support\LegacyBatches\LegacyBatchDeletionExecutor;
use App\Support\LegacyBatches\LegacyBatchTreeBuilder;
use App\Support\LegacyBatches\LegacyBatchUploadUrlFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegacyBatchController extends Controller
{
    public function __construct(
        private LegacyBatchDeletionExecutor $legacyBatchDeletionExecutor,
        private LegacyBatchTreeBuilder $legacyBatchTreeBuilder,
        private LegacyBatchUploadUrlFactory $legacyBatchUploadUrlFactory,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorizeLegacyBatchAccess($user);
        $perPage = in_array($request->integer('per_page', 20), [20, 50, 100], true)
            ? $request->integer('per_page', 20)
            : 20;

        $batches = LegacyBatch::query()
            ->visibleTo($user)
            ->with('uploadedBy')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => LegacyBatchResource::collection($batches->getCollection()),
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
        $this->authorizeLegacyBatchAccess($user);

        $validated = $request->validated();
        $manifestFiles = collect($validated['files']);

        $batch = DB::transaction(function () use ($validated, $manifestFiles, $user) {
            $batch = LegacyBatch::query()->create([
                'uuid' => (string) Str::uuid(),
                'batch_name' => $validated['batch_name'],
                'root_folder' => $validated['root_folder'],
                'year' => (int) $validated['year'],
                'department' => $validated['department'],
                'notes' => $validated['notes'] ?? null,
                'status' => LegacyBatchStatus::Draft,
                'expected_file_count' => $manifestFiles->count(),
                'uploaded_file_count' => 0,
                'failed_file_count' => 0,
                'total_size_bytes' => (int) $manifestFiles->sum('size_bytes'),
                'storage_disk' => config('filesystems.document_disk', 's3'),
                'uploaded_by' => $user->id,
                'last_activity_at' => now(),
            ]);

            $batch->files()->createMany(
                $manifestFiles->map(function (array $file) use ($batch): array {
                    $relativePath = $this->legacyBatchUploadUrlFactory->normalizeRelativePath($file['relative_path']);

                    return [
                        'relative_path' => $relativePath,
                        'storage_path' => $this->legacyBatchUploadUrlFactory->pathFor($batch, $relativePath),
                        'filename' => str($relativePath)->afterLast('/')->value(),
                        'mime_type' => $file['mime_type'] ?? null,
                        'size_bytes' => (int) $file['size_bytes'],
                        'modified_at' => $file['modified_at'] ?? null,
                        'status' => LegacyBatchFileStatus::Pending,
                    ];
                })->all(),
            );

            return $batch;
        });

        $batch->load(['uploadedBy', 'files']);
        $batch->setAttribute('tree', $this->legacyBatchTreeBuilder->build($batch));

        return (new LegacyBatchDetailResource($batch))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, LegacyBatch $legacyBatch): LegacyBatchDetailResource
    {
        $this->authorizeLegacyBatchVisibility($request->user(), $legacyBatch);

        $legacyBatch->load(['uploadedBy', 'files']);
        $legacyBatch->setAttribute('tree', $this->legacyBatchTreeBuilder->build($legacyBatch));

        return new LegacyBatchDetailResource($legacyBatch);
    }

    public function signUploads(
        SignLegacyBatchUploadsRequest $request,
        LegacyBatch $legacyBatch,
    ): JsonResponse {
        $this->authorizeLegacyBatchVisibility($request->user(), $legacyBatch);

        $relativePaths = collect($request->validated()['relative_paths'])
            ->map(fn (string $path): string => $this->legacyBatchUploadUrlFactory->normalizeRelativePath($path))
            ->values();

        $files = $legacyBatch->files()
            ->whereIn('relative_path', $relativePaths)
            ->where('status', '!=', LegacyBatchFileStatus::Uploaded->value)
            ->orderBy('relative_path')
            ->get();

        $legacyBatch->forceFill([
            'status' => LegacyBatchStatus::Uploading,
            'started_at' => $legacyBatch->started_at ?? now(),
            'last_activity_at' => now(),
        ])->save();

        $uploads = $files->map(function (LegacyBatchFile $file) use ($legacyBatch): array {
            $temporaryUpload = $this->legacyBatchUploadUrlFactory->make($legacyBatch, $file);

            return [
                'relative_path' => $file->relative_path,
                'upload_url' => $temporaryUpload['url'],
                'headers' => $temporaryUpload['headers'],
                'method' => 'PUT',
            ];
        })->values();

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
        $this->authorizeLegacyBatchVisibility($request->user(), $legacyBatch);

        $relativePaths = collect($request->validated()['relative_paths'])
            ->map(fn (string $path): string => $this->legacyBatchUploadUrlFactory->normalizeRelativePath($path))
            ->values();

        $files = $legacyBatch->files()
            ->whereIn('relative_path', $relativePaths)
            ->get();

        foreach ($files as $file) {
            $exists = Storage::disk($legacyBatch->storage_disk)->exists($file->storage_path);

            $file->forceFill([
                'status' => $exists ? LegacyBatchFileStatus::Uploaded : LegacyBatchFileStatus::Failed,
                'uploaded_at' => $exists ? now() : null,
                'failed_at' => $exists ? null : now(),
                'failure_reason' => $exists ? null : 'Uploaded object was not found on the configured storage disk.',
            ])->save();
        }

        $legacyBatch->syncProgressCounts();
        $legacyBatch->refresh()->load('uploadedBy');

        return new LegacyBatchResource($legacyBatch);
    }

    public function finalize(
        FinalizeLegacyBatchRequest $request,
        LegacyBatch $legacyBatch,
    ): LegacyBatchDetailResource {
        $this->authorizeLegacyBatchVisibility($request->user(), $legacyBatch);

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

        $legacyBatch->load(['uploadedBy', 'files']);
        $legacyBatch->setAttribute('tree', $this->legacyBatchTreeBuilder->build($legacyBatch));

        return new LegacyBatchDetailResource($legacyBatch);
    }

    public function destroy(Request $request, LegacyBatch $legacyBatch): Response
    {
        $this->authorizeLegacyBatchVisibility($request->user(), $legacyBatch);

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

        return response()->noContent();
    }

    public function downloadFile(
        Request $request,
        LegacyBatch $legacyBatch,
        LegacyBatchFile $legacyBatchFile,
    ): StreamedResponse {
        $this->authorizeLegacyBatchVisibility($request->user(), $legacyBatch);

        if ($legacyBatchFile->legacy_batch_id !== $legacyBatch->id) {
            abort(404, 'Legacy batch file not found.');
        }

        if ($legacyBatchFile->status !== LegacyBatchFileStatus::Uploaded) {
            abort(409, 'This file is not available for download yet.');
        }

        return Storage::disk($legacyBatch->storage_disk)->download(
            $legacyBatchFile->storage_path,
            $legacyBatchFile->filename,
        );
    }

    private function authorizeLegacyBatchAccess(User $user): void
    {
        if ($user->isAdmin() || $user->role?->value === 'encoder') {
            return;
        }

        abort(403, 'Only administrators or encoders can manage legacy batch uploads.');
    }

    private function authorizeLegacyBatchVisibility(User $user, LegacyBatch $legacyBatch): void
    {
        $this->authorizeLegacyBatchAccess($user);

        if ($user->isAdmin()) {
            return;
        }

        if ($legacyBatch->uploaded_by !== $user->id) {
            abort(403, 'You are not allowed to access this legacy batch.');
        }
    }
}
