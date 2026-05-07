<?php

namespace App\Http\Controllers\Notarial;

use App\Actions\Notarial\CreateNotarialPageScan;
use App\Actions\Notarial\DeleteNotarialPageScan;
use App\Actions\Notarial\UpdateNotarialPageScan;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\StoreNotarialPageScanRequest;
use App\Http\Requests\Notarial\UpdateNotarialPageScanRequest;
use App\Http\Resources\Notarial\NotarialPageScanResource;
use App\Models\NotarialBook;
use App\Models\NotarialPageScan;
use App\Queries\Notarial\NotarialPageScanIndexQuery;
use App\Support\Legal\NotarialPageScanFileManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialPageScanController extends Controller
{
    public function __construct(
        private NotarialPageScanIndexQuery $notarialPageScanIndexQuery,
        private CreateNotarialPageScan $createNotarialPageScan,
        private UpdateNotarialPageScan $updateNotarialPageScan,
        private DeleteNotarialPageScan $deleteNotarialPageScan,
        private NotarialPageScanFileManager $fileManager,
    ) {}

    public function index(NotarialBook $book): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialPageScan::class);

        return NotarialPageScanResource::collection($this->notarialPageScanIndexQuery->handle($book));
    }

    public function store(StoreNotarialPageScanRequest $request, NotarialBook $book): JsonResponse
    {
        $this->authorize('create', NotarialPageScan::class);

        $scan = $this->createNotarialPageScan->handle(
            $book,
            $request->validated(),
            $request->user(),
            $request->file('file'),
        );

        return (new NotarialPageScanResource($scan))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateNotarialPageScanRequest $request, NotarialPageScan $scan): NotarialPageScanResource
    {
        $this->authorize('update', $scan);

        $scan = $this->updateNotarialPageScan->handle($scan, $request->validated(), $request->file('file'));

        return new NotarialPageScanResource($scan);
    }

    public function destroy(NotarialPageScan $scan): JsonResponse
    {
        $this->authorize('delete', $scan);

        $this->deleteNotarialPageScan->handle($scan);

        return response()->json(['message' => 'Page scan deleted.']);
    }

    public function download(NotarialPageScan $scan): StreamedResponse
    {
        $this->authorize('view', $scan);

        return $this->fileManager->download($scan);
    }
}
