<?php

namespace App\Queries\LegalArchive;

use App\Http\Requests\LegalArchiveRecordIndexRequest;
use App\Models\LegalArchiveRecord;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LegalArchiveRecordIndexQuery
{
    public function handle(LegalArchiveRecordIndexRequest $request): LengthAwarePaginator
    {
        $query = LegalArchiveRecord::query()
            ->with('createdBy')
            ->latest('document_date')
            ->latest('created_at');

        $search = $request->search();

        if ($search !== null) {
            $query->where(function ($innerQuery) use ($search): void {
                $innerQuery->where('title', 'like', "%{$search}%")
                    ->orWhere('related_name', 'like', "%{$search}%")
                    ->orWhere('filename', 'like', "%{$search}%");
            });
        }

        if (($fileCategory = $request->fileCategory()) !== null) {
            $query->where('file_category', $fileCategory);
        }

        if (($fileCode = $request->fileCode()) !== null) {
            $query->where('file_code', $fileCode);
        }

        if (($uploadStatus = $request->uploadStatus()) === 'uploaded') {
            $query->whereNotNull('path');
        }

        if ($uploadStatus === 'missing_upload') {
            $query->whereNull('path');
        }

        return $query->paginate($request->perPage());
    }
}
