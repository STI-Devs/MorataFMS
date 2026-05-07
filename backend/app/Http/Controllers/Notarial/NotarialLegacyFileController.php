<?php

namespace App\Http\Controllers\Notarial;

use App\Actions\Notarial\DeleteNotarialLegacyFile;
use App\Actions\Notarial\StoreNotarialLegacyFiles;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\StoreNotarialLegacyFileRequest;
use App\Http\Resources\Notarial\NotarialLegacyFileResource;
use App\Models\NotarialBook;
use App\Models\NotarialLegacyFile;
use App\Queries\Notarial\NotarialLegacyFileIndexQuery;
use App\Support\Legal\NotarialLegacyFileManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialLegacyFileController extends Controller
{
    public function __construct(
        private NotarialLegacyFileIndexQuery $notarialLegacyFileIndexQuery,
        private StoreNotarialLegacyFiles $storeNotarialLegacyFiles,
        private DeleteNotarialLegacyFile $deleteNotarialLegacyFile,
        private NotarialLegacyFileManager $fileManager,
    ) {}

    public function index(NotarialBook $book): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialLegacyFile::class);

        return NotarialLegacyFileResource::collection($this->notarialLegacyFileIndexQuery->handle($book));
    }

    public function store(StoreNotarialLegacyFileRequest $request, NotarialBook $book): JsonResponse
    {
        $this->authorize('create', NotarialLegacyFile::class);

        $storedFiles = $this->storeNotarialLegacyFiles->handle(
            $book,
            $request->file('files', []),
            $request->user(),
        );

        return NotarialLegacyFileResource::collection($storedFiles)
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(NotarialLegacyFile $legacyFile): JsonResponse
    {
        $this->authorize('delete', $legacyFile);

        $this->deleteNotarialLegacyFile->handle($legacyFile);

        return response()->json(['message' => 'Legacy scanned file deleted.']);
    }

    public function download(NotarialLegacyFile $legacyFile): StreamedResponse
    {
        $this->authorize('view', $legacyFile);

        return $this->fileManager->download($legacyFile);
    }
}
