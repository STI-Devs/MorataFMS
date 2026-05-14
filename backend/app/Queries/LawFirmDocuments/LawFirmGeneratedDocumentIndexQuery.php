<?php

namespace App\Queries\LawFirmDocuments;

use App\Http\Requests\LawFirmDocuments\LawFirmGeneratedDocumentIndexRequest;
use App\Models\NotarialGeneratedDocument;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class LawFirmGeneratedDocumentIndexQuery
{
    public function handle(LawFirmGeneratedDocumentIndexRequest $request): LengthAwarePaginator
    {
        $query = NotarialGeneratedDocument::query()
            ->with(['template', 'createdBy', 'legalParty'])
            ->where('module', $request->module()->value)
            ->latest('generated_at')
            ->latest('created_at');

        if (($search = $request->search()) !== null) {
            $query->where(function ($innerQuery) use ($search): void {
                $innerQuery->where('template_label', 'like', "%{$search}%")
                    ->orWhere('template_code', 'like', "%{$search}%")
                    ->orWhere('party_name', 'like', "%{$search}%")
                    ->orWhere('filename', 'like', "%{$search}%");
            });
        }

        if (($documentCode = $request->documentCode()) !== null) {
            $query->where('document_code', $documentCode);
        }

        if (($documentCategory = $request->documentCategory()) !== null) {
            $query->where('document_category', $documentCategory);
        }

        if (($templateId = $request->templateId()) !== null) {
            $query->where('notarial_template_id', $templateId);
        }

        return $query->paginate($request->perPage());
    }
}
