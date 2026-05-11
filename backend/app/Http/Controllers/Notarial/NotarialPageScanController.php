<?php

namespace App\Http\Controllers\Notarial;

use App\Http\Controllers\Controller;
use App\Http\Requests\Notarial\StoreNotarialPageScanRequest;
use App\Http\Requests\Notarial\UpdateNotarialPageScanRequest;
use App\Http\Resources\Notarial\NotarialPageScanResource;
use App\Models\NotarialBook;
use App\Models\NotarialPageScan;
use App\Orchestrators\Notarial\NotarialPageScanOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialPageScanController extends Controller
{
    public function __construct(
        private NotarialPageScanOrchestrator $pageScans,
    ) {}

    public function index(NotarialBook $book): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialPageScan::class);

        return NotarialPageScanResource::collection($this->pageScans->index($book));
    }

    public function store(StoreNotarialPageScanRequest $request, NotarialBook $book): JsonResponse
    {
        $this->authorize('create', NotarialPageScan::class);

        return (new NotarialPageScanResource(
            $this->pageScans->store(
                $book,
                $request->validated(),
                $request->user(),
                $request->file('file'),
            )
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateNotarialPageScanRequest $request, NotarialPageScan $scan): NotarialPageScanResource
    {
        $this->authorize('update', $scan);

        return new NotarialPageScanResource(
            $this->pageScans->update($scan, $request->validated(), $request->file('file'))
        );
    }

    public function destroy(NotarialPageScan $scan): JsonResponse
    {
        $this->authorize('delete', $scan);

        $this->pageScans->delete($scan);

        return response()->json(['message' => 'Page scan deleted.']);
    }

    public function download(NotarialPageScan $scan): StreamedResponse
    {
        $this->authorize('view', $scan);

        return $this->pageScans->download($scan);
    }
}
