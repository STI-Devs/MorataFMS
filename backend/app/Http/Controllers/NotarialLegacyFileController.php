<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotarialLegacyFileRequest;
use App\Http\Resources\NotarialLegacyFileResource;
use App\Models\NotarialBook;
use App\Models\NotarialLegacyFile;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialLegacyFileController extends Controller
{
    public function index(NotarialBook $book): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialLegacyFile::class);

        $files = $book->legacyFiles()
            ->with('uploadedBy')
            ->latest('created_at')
            ->get();

        return NotarialLegacyFileResource::collection($files);
    }

    public function store(StoreNotarialLegacyFileRequest $request, NotarialBook $book): JsonResponse
    {
        $this->authorize('create', NotarialLegacyFile::class);

        $storedFiles = collect();

        foreach ($request->file('files', []) as $file) {
            if (! $file) {
                continue;
            }

            $legacyFile = new NotarialLegacyFile;
            $legacyFile->notarial_book_id = $book->id;
            $legacyFile->uploaded_by = $request->user()->id;

            $this->storeLegacyFile($legacyFile, $book, $file);
            $legacyFile->save();
            $legacyFile->load('uploadedBy');

            $storedFiles->push($legacyFile);
        }

        return NotarialLegacyFileResource::collection($storedFiles)
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(NotarialLegacyFile $legacyFile): JsonResponse
    {
        $this->authorize('delete', $legacyFile);

        $this->deleteLegacyFile($legacyFile);
        $legacyFile->delete();

        return response()->json(['message' => 'Legacy scanned file deleted.']);
    }

    public function download(NotarialLegacyFile $legacyFile): StreamedResponse
    {
        $this->authorize('view', $legacyFile);

        $disk = self::storageDisk();
        abort_unless($disk->exists($legacyFile->path), 404, 'Legacy scanned file not found on storage.');

        $stream = $disk->readStream($legacyFile->path);
        if (! $stream) {
            abort(500, 'Unable to read file stream.');
        }

        return response()->streamDownload(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $legacyFile->filename);
    }

    private function storeLegacyFile(NotarialLegacyFile $legacyFile, NotarialBook $book, $file): void
    {
        $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))->slug('_')->value();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $fileName = now()->format('YmdHis')."_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
        $directory = 'notarial-legacy-files/'.$book->year.'/book-'.str_pad((string) $book->book_number, 3, '0', STR_PAD_LEFT);

        self::storageDisk()->putFileAs($directory, $file, $fileName);

        $legacyFile->filename = $file->getClientOriginalName();
        $legacyFile->path = "{$directory}/{$fileName}";
        $legacyFile->disk = self::storageDiskName();
        $legacyFile->mime_type = $file->getMimeType();
        $legacyFile->size_bytes = $file->getSize() ?: 0;
    }

    private function deleteLegacyFile(NotarialLegacyFile $legacyFile): void
    {
        $disk = Storage::disk($legacyFile->disk ?: self::storageDiskName());

        if ($disk->exists($legacyFile->path)) {
            $disk->delete($legacyFile->path);
        }
    }

    private static function storageDiskName(): string
    {
        return (string) config('filesystems.default', 'local');
    }

    private static function storageDisk(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk(self::storageDiskName());

        return $disk;
    }
}
