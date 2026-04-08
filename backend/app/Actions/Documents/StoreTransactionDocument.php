<?php

namespace App\Actions\Documents;

use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Support\Documents\DocumentObjectTagger;
use Carbon\CarbonInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class StoreTransactionDocument
{
    public function __construct(private DocumentObjectTagger $documentObjectTagger) {}

    public function handle(
        ImportTransaction|ExportTransaction $transaction,
        UploadedFile $file,
        string $type,
        int $uploadedBy,
    ): Document {
        $storageDisk = $this->storageDisk();
        $storageDate = $this->storageDateFor($transaction);

        $path = Document::generateS3Path(
            get_class($transaction),
            $transaction->getKey(),
            $type,
            $file->getClientOriginalName(),
            $transaction->bl_no ?? '',
            $storageDate->year,
            $storageDate->month,
        );

        $stream = fopen($file->getRealPath(), 'r');
        $wasStored = false;

        try {
            $wasStored = Storage::disk($storageDisk)->writeStream(
                $path,
                $stream,
                $this->documentObjectTagger->uploadOptionsFor($transaction),
            );
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        if (! $wasStored) {
            throw new RuntimeException("Unable to write document to the [{$storageDisk}] disk.");
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
            Storage::disk($storageDisk)->delete($path);

            throw $exception;
        }

        $document->load('uploadedBy');
        $this->documentObjectTagger->syncDocument($document, $transaction);

        return $document;
    }

    private function storageDisk(): string
    {
        return config('filesystems.document_disk', 's3');
    }

    private function storageDateFor(ImportTransaction|ExportTransaction $transaction): CarbonInterface
    {
        if ((bool) ($transaction->is_archive ?? false)) {
            return $this->archiveDateFor($transaction);
        }

        return now();
    }

    private function archiveDateFor(ImportTransaction|ExportTransaction $transaction): CarbonInterface
    {
        return $transaction instanceof ImportTransaction
            ? ($transaction->arrival_date ?? $transaction->created_at ?? now())
            : ($transaction->export_date ?? $transaction->created_at ?? now());
    }
}
