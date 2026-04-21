<?php

namespace App\Http\Controllers;

use App\Enums\LegacyBatchFileStatus;
use App\Enums\LegacyBatchStatus;
use App\Http\Requests\AppendLegacyBatchManifestRequest;
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
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
        $expectedFileCount = (int) ($validated['expected_file_count'] ?? $manifestFiles->count());
        $totalSizeBytes = (int) ($validated['total_size_bytes'] ?? $manifestFiles->sum('size_bytes'));

        $batch = DB::transaction(function () use ($validated, $manifestFiles, $user, $expectedFileCount, $totalSizeBytes) {
            $batch = LegacyBatch::query()->create([
                'uuid' => (string) Str::uuid(),
                'batch_name' => $validated['batch_name'],
                'root_folder' => $validated['root_folder'],
                'year' => (int) $validated['year_to'],
                'year_from' => (int) $validated['year_from'],
                'year_to' => (int) $validated['year_to'],
                'department' => $validated['department'],
                'notes' => $validated['notes'] ?? null,
                'status' => LegacyBatchStatus::Draft,
                'expected_file_count' => $expectedFileCount,
                'uploaded_file_count' => 0,
                'failed_file_count' => 0,
                'total_size_bytes' => $totalSizeBytes,
                'storage_disk' => config('filesystems.document_disk', 's3'),
                'uploaded_by' => $user->id,
                'last_activity_at' => now(),
            ]);

            $this->upsertManifestFiles($batch, $manifestFiles->all());

            return $batch;
        });

        $batch->load(['uploadedBy', 'files']);
        $batch->setAttribute('tree', $this->legacyBatchTreeBuilder->build($batch));

        return (new LegacyBatchDetailResource($batch))
            ->response()
            ->setStatusCode(201);
    }

    public function appendManifest(
        AppendLegacyBatchManifestRequest $request,
        LegacyBatch $legacyBatch,
    ): JsonResponse {
        $this->authorizeLegacyBatchVisibility($request->user(), $legacyBatch);

        if ($legacyBatch->status !== LegacyBatchStatus::Draft) {
            abort(409, 'Legacy batch manifest can only be updated before uploads begin.');
        }

        $validated = $request->validated();

        $registeredFileCount = DB::transaction(function () use ($legacyBatch, $validated) {
            $this->upsertManifestFiles($legacyBatch, $validated['files']);

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

        if ($legacyBatch->files()->count() !== $legacyBatch->expected_file_count) {
            abort(409, 'The legacy batch manifest is incomplete. Finish registering the selected files before uploads begin.');
        }

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

    /**
     * @param  list<array{relative_path:string,size_bytes:int,mime_type?:string|null,modified_at?:string|null}>  $files
     */
    private function upsertManifestFiles(LegacyBatch $legacyBatch, array $files): void
    {
        if ($files === []) {
            return;
        }

        $timestamp = now();

        LegacyBatchFile::query()->upsert(
            collect($files)->map(function (array $file) use ($legacyBatch, $timestamp): array {
                $relativePath = $this->legacyBatchUploadUrlFactory->normalizeRelativePath($file['relative_path']);

                return [
                    'legacy_batch_id' => $legacyBatch->id,
                    'relative_path' => $relativePath,
                    'relative_path_hash' => hash('sha256', $relativePath),
                    'storage_path' => $this->legacyBatchUploadUrlFactory->pathFor($legacyBatch, $relativePath),
                    'filename' => str($relativePath)->afterLast('/')->value(),
                    'mime_type' => $file['mime_type'] ?? null,
                    'size_bytes' => (int) $file['size_bytes'],
                    'modified_at' => $this->normalizeModifiedAt($file['modified_at'] ?? null),
                    'status' => LegacyBatchFileStatus::Pending->value,
                    'uploaded_at' => null,
                    'failed_at' => null,
                    'failure_reason' => null,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            })->all(),
            ['legacy_batch_id', 'relative_path_hash'],
            ['relative_path', 'storage_path', 'filename', 'mime_type', 'size_bytes', 'modified_at', 'updated_at'],
        );
    }

    private function normalizeModifiedAt(?string $modifiedAt): ?string
    {
        if ($modifiedAt === null || trim($modifiedAt) === '') {
            return null;
        }

        return CarbonImmutable::parse($modifiedAt)->format('Y-m-d H:i:s');
    }
}
