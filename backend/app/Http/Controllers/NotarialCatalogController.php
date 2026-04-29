<?php

namespace App\Http\Controllers;

use App\Models\NotarialTemplate;
use App\Support\Legal\LegalDocumentCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotarialCatalogController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $this->authorize('viewAny', NotarialTemplate::class);

        return response()->json([
            'notarial_act_types' => LegalDocumentCatalog::notarialActTypes(),
            'template_field_types' => LegalDocumentCatalog::templateFieldTypes(),
            'categories' => LegalDocumentCatalog::categories(),
            'document_types' => LegalDocumentCatalog::documentTypes(),
            'grouped_document_types' => LegalDocumentCatalog::groupedDocumentTypes(),
            'legal_file_categories' => LegalDocumentCatalog::legalFileCategories(),
            'legal_file_types' => LegalDocumentCatalog::legalFileTypes(),
            'grouped_legal_file_types' => LegalDocumentCatalog::groupedLegalFileTypes(),
        ]);
    }
}
