<?php

namespace App\Http\Controllers\LawFirmDocuments;

use App\Enums\LawFirmDocumentModule;
use App\Http\Controllers\Controller;
use App\Models\NotarialTemplate;
use App\Support\LawFirmDocuments\LawFirmDocumentCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LawFirmDocumentCatalogController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $this->authorize('viewAny', NotarialTemplate::class);
        $module = $request->is('api/legal*')
            ? LawFirmDocumentModule::Legal
            : LawFirmDocumentModule::fromNullable($request->query('module'));

        return response()
            ->json([
                'notarial_act_types' => LawFirmDocumentCatalog::notarialActTypes(),
                'categories' => LawFirmDocumentCatalog::categoriesForModule($module),
                'document_types' => LawFirmDocumentCatalog::documentTypesForModule($module),
                'grouped_document_types' => $module === LawFirmDocumentModule::Legal
                    ? LawFirmDocumentCatalog::groupedLegalFileTypes()
                    : LawFirmDocumentCatalog::groupedDocumentTypes(),
                'legal_file_categories' => LawFirmDocumentCatalog::legalFileCategories(),
                'legal_file_types' => LawFirmDocumentCatalog::legalFileTypes(),
                'grouped_legal_file_types' => LawFirmDocumentCatalog::groupedLegalFileTypes(),
            ])
            ->header('Cache-Control', 'private, max-age=3600');
    }
}
