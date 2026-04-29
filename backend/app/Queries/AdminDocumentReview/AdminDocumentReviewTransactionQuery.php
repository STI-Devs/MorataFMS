<?php

namespace App\Queries\AdminDocumentReview;

use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\AdminDocumentReview\AdminDocumentReviewData;

class AdminDocumentReviewTransactionQuery
{
    public function __construct(
        private AdminDocumentReviewData $reviewData,
    ) {}

    public function find(string $type, int $id): ImportTransaction|ExportTransaction
    {
        return match ($type) {
            'import' => ImportTransaction::query()
                ->select([
                    'id',
                    'customs_ref_no',
                    'bl_no',
                    'vessel_name',
                    'importer_id',
                    'assigned_user_id',
                    'status',
                    'arrival_date',
                    'updated_at',
                ])
                ->whereKey($id)
                ->where('is_archive', false)
                ->whereIn('status', $this->reviewData->importStatusValues('all'))
                ->with([
                    'importer:id,name',
                    'assignedUser:id,name',
                    'stages:import_transaction_id,billing_completed_at,bonds_not_applicable,ppa_not_applicable,port_charges_not_applicable',
                    'documents' => function ($query) {
                        $query->select([
                            'id',
                            'documentable_id',
                            'documentable_type',
                            'type',
                            'filename',
                            'size_bytes',
                            'uploaded_by',
                            'created_at',
                        ])->with('uploadedBy:id,name')->orderByDesc('created_at');
                    },
                    'remarks' => function ($query) {
                        $query->select([
                            'id',
                            'remarkble_id',
                            'remarkble_type',
                            'author_id',
                            'message',
                            'is_resolved',
                            'created_at',
                        ])->with('author:id,name')->orderByDesc('created_at');
                    },
                ])
                ->firstOrFail(),
            'export' => ExportTransaction::query()
                ->select([
                    'id',
                    'bl_no',
                    'vessel',
                    'shipper_id',
                    'assigned_user_id',
                    'status',
                    'export_date',
                    'updated_at',
                ])
                ->whereKey($id)
                ->where('is_archive', false)
                ->whereIn('status', $this->reviewData->exportStatusValues('all'))
                ->with([
                    'shipper:id,name',
                    'assignedUser:id,name',
                    'stages:export_transaction_id,billing_completed_at,phytosanitary_not_applicable,co_not_applicable,dccci_not_applicable',
                    'documents' => function ($query) {
                        $query->select([
                            'id',
                            'documentable_id',
                            'documentable_type',
                            'type',
                            'filename',
                            'size_bytes',
                            'uploaded_by',
                            'created_at',
                        ])->with('uploadedBy:id,name')->orderByDesc('created_at');
                    },
                    'remarks' => function ($query) {
                        $query->select([
                            'id',
                            'remarkble_id',
                            'remarkble_type',
                            'author_id',
                            'message',
                            'is_resolved',
                            'created_at',
                        ])->with('author:id,name')->orderByDesc('created_at');
                    },
                ])
                ->firstOrFail(),
            default => abort(404, 'Invalid transaction type.'),
        };
    }
}
