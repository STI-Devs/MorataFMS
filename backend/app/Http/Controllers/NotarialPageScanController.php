<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotarialPageScanRequest;
use App\Http\Requests\UpdateNotarialPageScanRequest;
use App\Http\Resources\NotarialPageScanResource;
use App\Models\NotarialBook;
use App\Models\NotarialPageScan;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialPageScanController extends Controller
{
    public function index(NotarialBook $book): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialPageScan::class);

        $scans = $book->pageScans()
            ->with('uploadedBy')
            ->orderBy('page_start')
            ->get();

        return NotarialPageScanResource::collection($scans);
    }

    public function store(StoreNotarialPageScanRequest $request, NotarialBook $book): JsonResponse
    {
        $this->authorize('create', NotarialPageScan::class);

        $file = $request->file('file');

        $scan = new NotarialPageScan([
            'page_start' => (int) $request->input('page_start'),
            'page_end' => (int) $request->input('page_end'),
        ]);
        $scan->notarial_book_id = $book->id;
        $scan->uploaded_by = $request->user()->id;

        $this->storeScanFile($scan, $book, $file);
        $scan->save();

        $scan->load('uploadedBy');

        return (new NotarialPageScanResource($scan))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateNotarialPageScanRequest $request, NotarialPageScan $scan): NotarialPageScanResource
    {
        $this->authorize('update', $scan);

        $scan->page_start = (int) $request->input('page_start');
        $scan->page_end = (int) $request->input('page_end');

        if ($request->hasFile('file')) {
            $this->deleteScanFile($scan);
            $this->storeScanFile($scan, $scan->book, $request->file('file'));
        }

        $scan->save();
        $scan->load('uploadedBy');

        return new NotarialPageScanResource($scan);
    }

    public function destroy(NotarialPageScan $scan): JsonResponse
    {
        $this->authorize('delete', $scan);

        $this->deleteScanFile($scan);
        $scan->delete();

        return response()->json(['message' => 'Page scan deleted.']);
    }

    public function download(NotarialPageScan $scan): StreamedResponse
    {
        $this->authorize('view', $scan);

        $disk = self::scanDisk();
        abort_unless($disk->exists($scan->path), 404, 'Scan file not found on storage.');

        $stream = $disk->readStream($scan->path);
        if (! $stream) {
            abort(500, 'Unable to read file stream.');
        }

        return response()->streamDownload(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $scan->filename);
    }

    private function storeScanFile(NotarialPageScan $scan, NotarialBook $book, $file): void
    {
        $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))->slug('_')->value();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $bookNumber = str_pad((string) $book->book_number, 3, '0', STR_PAD_LEFT);
        $range = $scan->page_start.'-'.$scan->page_end;
        $fileName = now()->format('YmdHis')."_pages_{$range}_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
        $directory = "notarial-page-scans/{$book->year}/book-{$bookNumber}";

        self::scanDisk()->putFileAs($directory, $file, $fileName);

        $scan->filename = $file->getClientOriginalName();
        $scan->path = "{$directory}/{$fileName}";
        $scan->disk = self::storageDisk();
        $scan->mime_type = $file->getMimeType();
        $scan->size_bytes = $file->getSize() ?: 0;
    }

    private function deleteScanFile(NotarialPageScan $scan): void
    {
        if (! $scan->path) {
            return;
        }

        $disk = Storage::disk($scan->disk ?: self::storageDisk());

        if ($disk->exists($scan->path)) {
            $disk->delete($scan->path);
        }
    }

    private static function storageDisk(): string
    {
        return (string) config('filesystems.default', 'local');
    }

    private static function scanDisk(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk(self::storageDisk());

        return $disk;
    }
}
