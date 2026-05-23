<?php

namespace App\Orchestrators\LegalArchive;

use App\Actions\LegalArchive\CreateLegalArchiveRecord;
use App\Data\LegalArchive\LegalArchiveRecordData;
use App\Data\LegalArchive\LegalArchiveRecordIndexFilters;
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

    public function index(LegalArchiveRecordIndexFilters $filters): LengthAwarePaginator
    {
        return $this->legalArchiveRecordIndexQuery->handle($filters);
    }

    public function store(LegalArchiveRecordData $data, User $user, ?UploadedFile $file): LegalArchiveRecord
    {
        return $this->createLegalArchiveRecord->handle($data, $user, $file);
    }

    public function download(LegalArchiveRecord $record): StreamedResponse
    {
        return $this->fileManager->download($record);
    }
}
