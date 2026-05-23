<?php

namespace App\Queries\LegalArchive;

use App\Data\LegalArchive\LegalArchiveRecordIndexFilters;
use App\Models\LegalArchiveRecord;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LegalArchiveRecordIndexQuery
{
    public function handle(LegalArchiveRecordIndexFilters $filters): LengthAwarePaginator
    {
        $query = LegalArchiveRecord::query()
            ->with('createdBy')
            ->latest('document_date')
            ->latest('created_at');

        $search = $filters->search;

        if ($search !== null) {
            $query->where(function ($innerQuery) use ($search): void {
                $innerQuery->where('title', 'like', "%{$search}%")
                    ->orWhere('related_name', 'like', "%{$search}%")
                    ->orWhere('filename', 'like', "%{$search}%");
            });
        }

        if (($fileCategory = $filters->fileCategory) !== null) {
            $query->where('file_category', $fileCategory);
        }

        if (($fileCode = $filters->fileCode) !== null) {
            $query->where('file_code', $fileCode);
        }

        if (($uploadStatus = $filters->uploadStatus) === 'uploaded') {
            $query->whereNotNull('path');
        }

        if ($uploadStatus === 'missing_upload') {
            $query->whereNull('path');
        }

        return $query->paginate($filters->perPage);
    }
}
