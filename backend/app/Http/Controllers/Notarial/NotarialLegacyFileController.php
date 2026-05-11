<?php

namespace App\Http\Controllers\Notarial;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\StoreNotarialLegacyFileRequest;
use App\Http\Resources\Notarial\NotarialLegacyFileResource;
use App\Models\NotarialBook;
use App\Models\NotarialLegacyFile;
use App\Orchestrators\Notarial\NotarialLegacyFileOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialLegacyFileController extends Controller
{
    public function __construct(
        private NotarialLegacyFileOrchestrator $legacyFiles,
    ) {}

    public function index(NotarialBook $book): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialLegacyFile::class);

        return NotarialLegacyFileResource::collection($this->legacyFiles->index($book));
    }

    public function store(StoreNotarialLegacyFileRequest $request, NotarialBook $book): JsonResponse
    {
        $this->authorize('create', NotarialLegacyFile::class);

        return NotarialLegacyFileResource::collection(
            $this->legacyFiles->store(
                $book,
                $request->file('files', []),
                $request->user(),
            )
        )
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(NotarialLegacyFile $legacyFile): JsonResponse
    {
        $this->authorize('delete', $legacyFile);

        $this->legacyFiles->delete($legacyFile);

        return response()->json(['message' => 'Legacy scanned file deleted.']);
    }

    public function download(NotarialLegacyFile $legacyFile): StreamedResponse
    {
        $this->authorize('view', $legacyFile);

        return $this->legacyFiles->download($legacyFile);
    }
}
