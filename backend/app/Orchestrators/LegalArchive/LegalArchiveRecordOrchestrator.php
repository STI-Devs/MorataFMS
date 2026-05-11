<?php

namespace App\Orchestrators\LegalArchive;

use App\Actions\LegalArchive\CreateLegalArchiveRecord;
use App\Http\Requests\LegalArchive\LegalArchiveRecordIndexRequest;
use App\Models\LegalArchiveRecord;
use App\Models\User;
use App\Queries\LegalArchive\LegalArchiveRecordIndexQuery;
use App\Support\Legal\LegalArchiveRecordFileManager;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegalArchiveRecordOrchestrator
{
    public function __construct(
        private LegalArchiveRecordIndexQuery $legalArchiveRecordIndexQuery,
        private CreateLegalArchiveRecord $createLegalArchiveRecord,
        private LegalArchiveRecordFileManager $fileManager,
    ) {}

    public function index(LegalArchiveRecordIndexRequest $request): LengthAwarePaginator
    {
        return $this->legalArchiveRecordIndexQuery->handle($request);
    }

    public function store(array $validated, User $user, ?UploadedFile $file): LegalArchiveRecord
    {
        return $this->createLegalArchiveRecord->handle($validated, $user, $file);
    }

    public function download(LegalArchiveRecord $record): StreamedResponse
    {
        return $this->fileManager->download($record);
    }
}
