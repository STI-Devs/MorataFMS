<?php

namespace App\Actions\Documents;

use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class StoreTransactionDocument
{
    public function handle(
        ImportTransaction|ExportTransaction $transaction,
        UploadedFile $file,
        string $type,
        int $uploadedBy,
    ): Document {
        $transactionDate = $transaction instanceof ImportTransaction
            ? ($transaction->arrival_date ?? $transaction->created_at ?? now())
            : ($transaction->export_date ?? $transaction->created_at ?? now());

        $path = Document::generateS3Path(
            get_class($transaction),
            $transaction->getKey(),
            $type,
            $file->getClientOriginalName(),
            $transaction->bl_no ?? '',
            $transactionDate->year,
            (bool) ($transaction->is_archive ?? false),
            $transactionDate->month,
        );

        $stream = fopen($file->getRealPath(), 'r');

        try {
            Storage::disk($this->storageDisk())->writeStream($path, $stream);
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        try {
            $document = DB::transaction(function () use ($path, $file, $transaction, $type, $uploadedBy) {
                $document = new Document([
                    'type' => $type,
                    'filename' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size_bytes' => $file->getSize(),
                    'version' => 1,
                ]);
                $document->documentable_type = get_class($transaction);
                $document->documentable_id = $transaction->getKey();
                $document->uploaded_by = $uploadedBy;
                $document->save();

                return $document;
            });
        } catch (Throwable $exception) {
            Storage::disk($this->storageDisk())->delete($path);

            throw $exception;
        }

        $document->load('uploadedBy');

        return $document;
    }

    private function storageDisk(): string
    {
        return config('filesystems.document_disk', 's3');
    }
}
