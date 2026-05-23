<?php

namespace App\Actions\Archives;

use App\Actions\Documents\StoreTransactionDocument;
use App\Data\Archives\ArchiveImportData;
use App\Enums\ArchiveOrigin;
use App\Enums\ImportStatus;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CreateArchiveImport
{
    public function __construct(private StoreTransactionDocument $storeTransactionDocument) {}

    public function handle(ArchiveImportData $data, User $user): ImportTransaction
    {
        $storedPaths = [];

        try {
            $transaction = DB::transaction(function () use ($data, $user, &$storedPaths) {
                $transaction = new ImportTransaction;
                $transaction->customs_ref_no = $data->customsRefNo
                    ?? 'ARCH-'.$data->fileDate.'-'.strtoupper(substr(uniqid(), -6));
                $transaction->bl_no = $data->blNo;
                $transaction->vessel_name = $data->vesselName;
                $transaction->selective_color = $data->selectiveColor->value;
                $transaction->importer_id = $data->importerId;
                $transaction->origin_country_id = $data->originCountryId;
                $transaction->location_of_goods_id = $data->locationOfGoodsId;
                $transaction->arrival_date = $data->fileDate;
                $transaction->notes = $data->notes;
                $transaction->is_archive = true;
                $transaction->archived_at = now();
                $transaction->archived_by = $user->id;
                $transaction->archive_origin = ArchiveOrigin::DirectArchiveUpload;
                $transaction->assigned_user_id = $user->id;
                $transaction->status = ImportStatus::Completed;
                $transaction->save();

                foreach ($data->notApplicableStages as $stage) {
                    $transaction->setStageApplicability($stage, true, $user->id);
                }

                foreach ($data->documents as $document) {
                    $storedDocument = $this->storeTransactionDocument->handle(
                        $transaction,
                        $document->file,
                        $document->stage,
                        $user->id,
                    );

                    $storedPaths[] = $storedDocument->path;
                }

                if (
                    $data->hasDocumentOrApplicabilityChanges()
                    && method_exists($transaction, 'recalculateStatus')
                ) {
                    $transaction->recalculateStatus();
                    $transaction->status = ImportStatus::Completed;
                    $transaction->saveQuietly();
                }

                return $transaction;
            });
        } catch (Throwable $exception) {
            foreach ($storedPaths as $path) {
                Storage::disk($this->storageDisk())->delete($path);
            }

            throw $exception;
        }

        $transaction->load(['importer', 'originCountry', 'locationOfGoods', 'stages', 'assignedUser']);

        return $transaction;
    }

    private function storageDisk(): string
    {
        return (string) config('filesystems.default', 'local');
    }
}
