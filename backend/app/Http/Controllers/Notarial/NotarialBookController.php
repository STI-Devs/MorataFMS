<?php

namespace App\Http\Controllers\Notarial;

use App\Actions\Notarial\CreateNotarialBook;
use App\Actions\Notarial\DeleteNotarialBook;
use App\Actions\Notarial\UpdateNotarialBook;
use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\NotarialBookIndexRequest;
use App\Http\Requests\Notarial\StoreNotarialBookRequest;
use App\Http\Requests\Notarial\UpdateNotarialBookRequest;
use App\Http\Resources\Notarial\NotarialBookResource;
use App\Models\NotarialBook;
use App\Queries\Notarial\NotarialBookIndexQuery;
use App\Queries\Notarial\NotarialBookShowQuery;
use App\Support\Legal\NotarialBookFileManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialBookController extends Controller
{
    public function __construct(
        private NotarialBookIndexQuery $notarialBookIndexQuery,
        private NotarialBookShowQuery $notarialBookShowQuery,
        private CreateNotarialBook $createNotarialBook,
        private UpdateNotarialBook $updateNotarialBook,
        private DeleteNotarialBook $deleteNotarialBook,
        private NotarialBookFileManager $fileManager,
    ) {}

    public function index(NotarialBookIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialBook::class);

        return NotarialBookResource::collection($this->notarialBookIndexQuery->handle($request));
    }

    public function show(NotarialBook $book): NotarialBookResource
    {
        $this->authorize('view', $book);

        return new NotarialBookResource($this->notarialBookShowQuery->handle($book));
    }

    public function store(StoreNotarialBookRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialBook::class);

        $book = $this->createNotarialBook->handle(
            $request->safe()->except('file'),
            $request->user(),
            $request->file('file'),
        );

        return (new NotarialBookResource($book))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateNotarialBookRequest $request, NotarialBook $book): NotarialBookResource
    {
        $this->authorize('update', $book);

        $book = $this->updateNotarialBook->handle(
            $book,
            $request->safe()->except('file'),
            $request->file('file'),
        );

        return new NotarialBookResource($book);
    }

    public function destroy(NotarialBook $book): JsonResponse
    {
        $this->authorize('delete', $book);

        $this->deleteNotarialBook->handle($book);

        return response()->json(['message' => 'Book deleted.'], 200);
    }

    public function downloadScan(NotarialBook $book): StreamedResponse
    {
        $this->authorize('view', $book);

        return $this->fileManager->download($book);
    }
}
