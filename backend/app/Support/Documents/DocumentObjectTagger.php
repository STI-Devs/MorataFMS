<?php

namespace App\Support\Documents;

use App\Enums\ArchiveOrigin;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Carbon\CarbonInterface;
use Illuminate\Support\Facades\Storage;
use Throwable;

class DocumentObjectTagger
{
    /**
     * @return array<string, string>
     */
    public function uploadOptionsFor(ImportTransaction|ExportTransaction $transaction): array
    {
        if (! $this->supportsObjectTagging()) {
            return [];
        }

        return [
            'Tagging' => $this->taggingHeader($this->tagMapFor($transaction)),
        ];
    }

    public function syncDocument(Document $document, ImportTransaction|ExportTransaction $transaction): void
    {
        if (! $this->supportsObjectTagging()) {
            return;
        }

        $disk = Storage::disk($this->storageDisk());
        $bucket = $disk->getConfig()['bucket'] ?? null;

        if (! is_string($bucket) || $bucket === '') {
            return;
        }

        try {
            $disk->getClient()->putObjectTagging([
                'Bucket' => $bucket,
                'Key' => $disk->path($document->path),
                'Tagging' => [
                    'TagSet' => $this->tagSetFor($document, $transaction),
                ],
            ]);
        } catch (Throwable $exception) {
            report($exception);
        }
    }

    public function syncTransactionDocuments(ImportTransaction|ExportTransaction $transaction): void
    {
        foreach ($transaction->documents as $document) {
            $this->syncDocument($document, $transaction);
        }
    }

    /**
     * @return list<array{Key: string, Value: string}>
     */
    public function tagSetFor(Document $document, ImportTransaction|ExportTransaction $transaction): array
    {
        $tagMap = $this->tagMapFor($transaction);
        $tagMap['document_id'] = (string) $document->id;

        return collect($tagMap)
            ->map(fn (string $value, string $key): array => ['Key' => $key, 'Value' => $value])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, string>  $tagMap
     */
    public function taggingHeader(array $tagMap): string
    {
        return http_build_query($tagMap, '', '&', PHP_QUERY_RFC3986);
    }

    private function supportsObjectTagging(): bool
    {
        $disk = Storage::disk($this->storageDisk());

        return method_exists($disk, 'getClient')
            && is_string($disk->getConfig()['bucket'] ?? null)
            && $disk->getConfig()['bucket'] !== '';
    }

    private function storageDisk(): string
    {
        return config('filesystems.document_disk', 's3');
    }

    /**
     * @return array<string, string>
     */
    private function tagMapFor(ImportTransaction|ExportTransaction $transaction): array
    {
        $tagMap = [
            'state' => $transaction->is_archive ? 'archived' : 'live',
            'origin' => $this->archiveOriginValue($transaction),
            'transaction_type' => $transaction instanceof ImportTransaction ? 'import' : 'export',
            'transaction_id' => (string) $transaction->id,
        ];

        if ($transaction->is_archive && $transaction->archived_at instanceof CarbonInterface) {
            $tagMap['archived_at'] = $transaction->archived_at->toIso8601String();
        }

        if ($transaction->is_archive && $transaction->archived_by !== null) {
            $tagMap['archived_by'] = (string) $transaction->archived_by;
        }

        return $tagMap;
    }

    private function archiveOriginValue(ImportTransaction|ExportTransaction $transaction): string
    {
        if (! $transaction->is_archive) {
            return 'live_upload';
        }

        $origin = $transaction->archive_origin;

        if ($origin instanceof ArchiveOrigin) {
            return $origin->value;
        }

        return $origin ?: ArchiveOrigin::ArchivedFromLive->value;
    }
}
