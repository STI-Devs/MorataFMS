<?php

namespace App\Actions\LegalArchive;

use App\Data\LegalArchive\LegalArchiveRecordData;
use App\Models\LegalArchiveRecord;
use App\Models\User;
use App\Support\Legal\LegalArchiveRecordFileManager;
use Illuminate\Http\UploadedFile;

class CreateLegalArchiveRecord
{
    public function __construct(
        private LegalArchiveRecordFileManager $fileManager,
    ) {}

    public function handle(LegalArchiveRecordData $data, User $user, ?UploadedFile $file): LegalArchiveRecord
    {
        $record = new LegalArchiveRecord($data->toAttributes());
        $record->created_by = $user->id;

        if ($file !== null) {
            $this->fileManager->store($record, $file, $data->fileCategory);
        }

        $record->save();
        $record->load('createdBy');

        return $record;
    }
}
