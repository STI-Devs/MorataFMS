<?php

namespace App\Actions\LegalArchive;

use App\Models\LegalArchiveRecord;
use App\Models\User;
use App\Support\Legal\LegalArchiveRecordFileManager;
use Illuminate\Http\UploadedFile;

class CreateLegalArchiveRecord
{
    public function __construct(
        private LegalArchiveRecordFileManager $fileManager,
    ) {}

    public function handle(array $validated, User $user, ?UploadedFile $file): LegalArchiveRecord
    {
        $record = new LegalArchiveRecord($validated);
        $record->created_by = $user->id;

        if ($file !== null) {
            $this->fileManager->store($record, $file, (string) $validated['file_category']);
        }

        $record->save();
        $record->load('createdBy');

        return $record;
    }
}
