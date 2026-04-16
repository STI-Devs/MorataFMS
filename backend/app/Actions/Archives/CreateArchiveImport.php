<?php

namespace App\Actions\Archives;

use App\Actions\Documents\StoreTransactionDocument;
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

    public function handle(array $validated, User $user): ImportTransaction
    {
        $storedPaths = [];

        try {
            $transaction = DB::transaction(function () use ($validated, $user, &$storedPaths) {
                $transaction = new ImportTransaction;
                $transaction->customs_ref_no = $validated['customs_ref_no']
                    ?? 'ARCH-'.$validated['file_date'].'-'.strtoupper(substr(uniqid(), -6));
                $transaction->bl_no = $validated['bl_no'];
                $transaction->vessel_name = $validated['vessel_name'] ?? null;
                $transaction->selective_color = $validated['selective_color'];
                $transaction->importer_id = $validated['importer_id'];
                $transaction->origin_country_id = $validated['origin_country_id'] ?? null;
                $transaction->location_of_goods_id = $validated['location_of_goods_id'] ?? null;
                $transaction->arrival_date = $validated['file_date'];
                $transaction->notes = $validated['notes'] ?? null;
                $transaction->is_archive = true;
                $transaction->archived_at = now();
                $transaction->archived_by = $user->id;
                $transaction->archive_origin = ArchiveOrigin::DirectArchiveUpload;
                $transaction->assigned_user_id = $user->id;
                $transaction->status = ImportStatus::Completed;
                $transaction->save();

                foreach ($validated['not_applicable_stages'] ?? [] as $stage) {
                    $transaction->setStageApplicability($stage, true, $user->id);
                }

                foreach ($validated['documents'] ?? [] as $document) {
                    $storedDocument = $this->storeTransactionDocument->handle(
                        $transaction,
                        $document['file'],
                        $document['stage'],
                        $user->id,
                    );

                    $storedPaths[] = $storedDocument->path;
                }

                if (
                    (! empty($validated['documents']) || ! empty($validated['not_applicable_stages']))
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
        return config('filesystems.document_disk', 's3');
    }
}
