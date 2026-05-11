<?php

namespace App\Http\Controllers\LegalArchive;

use App\Http\Controllers\Controller;
use App\Http\Requests\LegalArchive\LegalArchiveRecordIndexRequest;
use App\Http\Requests\LegalArchive\StoreLegalArchiveRecordRequest;
use App\Http\Resources\LegalArchive\LegalArchiveRecordResource;
use App\Models\LegalArchiveRecord;
use App\Orchestrators\LegalArchive\LegalArchiveRecordOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegalArchiveRecordController extends Controller
{
    public function __construct(
        private LegalArchiveRecordOrchestrator $legalArchiveRecords,
    ) {}

    public function index(LegalArchiveRecordIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LegalArchiveRecord::class);

        return LegalArchiveRecordResource::collection($this->legalArchiveRecords->index($request));
    }

    public function store(StoreLegalArchiveRecordRequest $request): JsonResponse
    {
        $this->authorize('create', LegalArchiveRecord::class);

        return (new LegalArchiveRecordResource(
            $this->legalArchiveRecords->store(
                $request->safe()->except('file'),
                $request->user(),
                $request->file('file'),
            )
        ))
            ->response()
            ->setStatusCode(201);
    }

    public function download(LegalArchiveRecord $record): StreamedResponse
    {
        $this->authorize('view', $record);

        return $this->legalArchiveRecords->download($record);
    }
}
