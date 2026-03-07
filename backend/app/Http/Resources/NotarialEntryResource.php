<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotarialEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'doc_number' => $this->doc_number,
            'document_type' => $this->document_type,
            'document_type_other' => $this->document_type_other,
            'document_type_label' => $this->getDocumentTypeLabel(),
            'title' => $this->title,
            'client' => $this->whenLoaded('client', fn() => [
                'id' => $this->client->id,
                'name' => $this->client->name,
            ]),
            'signer_names' => $this->signer_names,
            'id_type' => $this->id_type,
            'id_number' => $this->id_number,
            'notary_fee' => $this->notary_fee,
            'notarized_at' => $this->notarized_at,
            'notes' => $this->notes,
            'book' => $this->whenLoaded('book', fn() => [
                'id' => $this->book->id,
                'book_number' => $this->book->book_number,
                'year' => $this->book->year,
            ]),
            'created_by' => $this->whenLoaded('createdBy', fn() => [
                'id' => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'documents_count' => $this->whenCounted('documents'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    private function getDocumentTypeLabel(): string
    {
        if ($this->document_type === 'other') {
            return $this->document_type_other ?? 'Other';
        }

        $labels = \App\Models\NotarialEntry::getDocumentTypeLabels();
        return $labels[$this->document_type] ?? $this->document_type;
    }
}
