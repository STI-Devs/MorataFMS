<?php

namespace App\Http\Controllers;

use App\Actions\LegalArchive\CreateLegalArchiveRecord;
use App\Http\Requests\LegalArchiveRecordIndexRequest;
use App\Http\Requests\StoreLegalArchiveRecordRequest;
use App\Http\Resources\LegalArchiveRecordResource;
use App\Models\LegalArchiveRecord;
use App\Queries\LegalArchive\LegalArchiveRecordIndexQuery;
use App\Support\Legal\LegalArchiveRecordFileManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegalArchiveRecordController extends Controller
{
    public function __construct(
        private LegalArchiveRecordIndexQuery $legalArchiveRecordIndexQuery,
        private CreateLegalArchiveRecord $createLegalArchiveRecord,
        private LegalArchiveRecordFileManager $fileManager,
    ) {}

    public function index(LegalArchiveRecordIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LegalArchiveRecord::class);

        return LegalArchiveRecordResource::collection($this->legalArchiveRecordIndexQuery->handle($request));
    }

    public function store(StoreLegalArchiveRecordRequest $request): JsonResponse
    {
        $this->authorize('create', LegalArchiveRecord::class);

        $record = $this->createLegalArchiveRecord->handle(
            $request->safe()->except('file'),
            $request->user(),
            $request->file('file'),
        );

        return (new LegalArchiveRecordResource($record))
            ->response()
            ->setStatusCode(201);
    }

    public function download(LegalArchiveRecord $record): StreamedResponse
    {
        $this->authorize('view', $record);

        return $this->fileManager->download($record);
    }
}
