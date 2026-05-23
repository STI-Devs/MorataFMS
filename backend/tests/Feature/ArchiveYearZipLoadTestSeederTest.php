<?php

use App\Enums\ArchiveOrigin;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use Database\Seeders\ArchiveYearZipLoadTestSeeder;
use Illuminate\Support\Facades\Storage;

test('archive year zip load test seeder creates multiple folders for fy zip testing', function () {
    $diskName = config('filesystems.default', 'local');
    Storage::fake($diskName);

    $this->seed(ArchiveYearZipLoadTestSeeder::class);

    $imports = ImportTransaction::query()
        ->where('bl_no', 'like', 'FYZIP2025%')
        ->get();
    $exports = ExportTransaction::query()
        ->where('bl_no', 'like', 'FYZIP2025%')
        ->get();
    $documents = Document::query()
        ->where(function ($query) use ($imports): void {
            $query
                ->where('documentable_type', ImportTransaction::class)
                ->whereIn('documentable_id', $imports->pluck('id'));
        })
        ->orWhere(function ($query) use ($exports): void {
            $query
                ->where('documentable_type', ExportTransaction::class)
                ->whereIn('documentable_id', $exports->pluck('id'));
        })
        ->get();

    expect($imports)->toHaveCount(252);
    expect($exports)->toHaveCount(252);
    expect($imports->pluck('arrival_date')->map->year->unique()->values()->all())->toBe([2025]);
    expect($exports->pluck('export_date')->map->year->unique()->values()->all())->toBe([2025]);
    expect($imports->pluck('arrival_date')->map->month->unique()->sort()->values()->all())->toBe(range(1, 12));
    expect($exports->pluck('export_date')->map->month->unique()->sort()->values()->all())->toBe(range(1, 12));
    expect($imports->pluck('archive_origin')->unique()->values()->all())->toBe([ArchiveOrigin::DirectArchiveUpload]);
    expect($exports->pluck('archive_origin')->unique()->values()->all())->toBe([ArchiveOrigin::DirectArchiveUpload]);
    expect($documents)->toHaveCount(2016);

    $sampleDocument = $documents->firstOrFail();
    Storage::disk($diskName)->assertExists($sampleDocument->path);
});
