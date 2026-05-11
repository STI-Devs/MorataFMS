<?php

namespace App\Http\Controllers\Notarial;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\NotarialBookIndexRequest;
use App\Http\Requests\Notarial\StoreNotarialBookRequest;
use App\Http\Requests\Notarial\UpdateNotarialBookRequest;
use App\Http\Resources\Notarial\NotarialBookResource;
use App\Models\NotarialBook;
use App\Orchestrators\Notarial\NotarialBookOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialBookController extends Controller
{
    public function __construct(
        private NotarialBookOrchestrator $books,
    ) {}

    public function index(NotarialBookIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialBook::class);

        return NotarialBookResource::collection($this->books->index($request));
    }

    public function show(NotarialBook $book): NotarialBookResource
    {
        $this->authorize('view', $book);

        return new NotarialBookResource($this->books->show($book));
    }

    public function store(StoreNotarialBookRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialBook::class);

        return (new NotarialBookResource(
            $this->books->store(
                $request->safe()->except('file'),
                $request->user(),
                $request->file('file'),
            )
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateNotarialBookRequest $request, NotarialBook $book): NotarialBookResource
    {
        $this->authorize('update', $book);

        return new NotarialBookResource(
            $this->books->update(
                $book,
                $request->safe()->except('file'),
                $request->file('file'),
            )
        );
    }

    public function destroy(NotarialBook $book): JsonResponse
    {
        $this->authorize('delete', $book);

        $this->books->delete($book);

        return response()->json(['message' => 'Book deleted.'], 200);
    }

    public function downloadScan(NotarialBook $book): StreamedResponse
    {
        $this->authorize('view', $book);

        return $this->books->downloadScan($book);
    }
}
