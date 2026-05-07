<?php

namespace App\Queries\Notarial;

use App\Http\Requests\Notarial\NotarialTemplateIndexRequest;
use App\Models\NotarialTemplate;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotarialTemplateIndexQuery
{
    public function handle(NotarialTemplateIndexRequest $request): LengthAwarePaginator
    {
        $query = NotarialTemplate::query()
            ->with('createdBy')
            ->orderBy('label');

        if (($search = $request->search()) !== null) {
            $query->where(function ($innerQuery) use ($search): void {
                $innerQuery->where('label', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('document_code', 'like', "%{$search}%");
            });
        }

        if (($documentCode = $request->documentCode()) !== null) {
            $query->where('document_code', $documentCode);
        }

        if (($isActive = $request->isActiveFilter()) !== null) {
            $query->where('is_active', $isActive);
        }

        if (($templateStatus = $request->templateStatus()) === 'ready') {
            $query->whereNotNull('path');
        }

        if ($templateStatus === 'missing_file') {
            $query->whereNull('path');
        }

        return $query->paginate($request->perPage());
    }
}
