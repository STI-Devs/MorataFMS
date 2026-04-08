<?php

use App\Enums\ArchiveOrigin;
use App\Models\Document;
use App\Models\ImportTransaction;
use App\Support\Documents\DocumentObjectTagger;
use Illuminate\Support\Carbon;
use Tests\TestCase;

uses(TestCase::class);

test('tag set includes live upload metadata', function () {
    $transaction = new ImportTransaction;
    $transaction->id = 123;
    $transaction->is_archive = false;

    $document = new Document;
    $document->id = 456;

    $tags = collect((new DocumentObjectTagger)->tagSetFor($document, $transaction))
        ->pluck('Value', 'Key')
        ->all();

    expect($tags)->toMatchArray([
        'state' => 'live',
        'origin' => 'live_upload',
        'transaction_type' => 'import',
        'transaction_id' => (string) $transaction->id,
        'document_id' => (string) $document->id,
    ]);
    expect(array_key_exists('archived_at', $tags))->toBeFalse();
    expect(array_key_exists('archived_by', $tags))->toBeFalse();
});

test('tag set includes archived metadata for live transactions archived later', function () {
    $archivedAt = Carbon::parse('2026-04-06T04:39:14+08:00');
    $transaction = new ImportTransaction;
    $transaction->id = 123;
    $transaction->is_archive = true;
    $transaction->archived_at = $archivedAt;
    $transaction->archived_by = 77;
    $transaction->archive_origin = ArchiveOrigin::ArchivedFromLive;

    $document = new Document;
    $document->id = 456;

    $tags = collect((new DocumentObjectTagger)->tagSetFor($document, $transaction))
        ->pluck('Value', 'Key')
        ->all();

    expect($tags)->toMatchArray([
        'state' => 'archived',
        'origin' => ArchiveOrigin::ArchivedFromLive->value,
        'transaction_type' => 'import',
        'transaction_id' => (string) $transaction->id,
        'document_id' => (string) $document->id,
        'archived_at' => $transaction->archived_at->toIso8601String(),
        'archived_by' => '77',
    ]);
});

test('tagging header uses RFC 3986 encoding', function () {
    $header = (new DocumentObjectTagger)->taggingHeader([
        'origin' => 'direct archive upload',
        'state' => 'archived',
    ]);

    expect($header)->toBe('origin=direct%20archive%20upload&state=archived');
});
