<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotarialBookRequest;
use App\Http\Requests\UpdateNotarialBookRequest;
use App\Http\Resources\NotarialBookResource;
use App\Models\NotarialBook;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialBookController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', NotarialBook::class);

        $query = NotarialBook::query()
            ->with('createdBy')
            ->withCount(['templateRecords', 'pageScans', 'legacyFiles'])
            ->orderByDesc('year')
            ->orderByDesc('book_number');

        if ($request->filled('year')) {
            $query->where('year', $request->input('year'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $books = $query->paginate($request->input('per_page', 15));

        return NotarialBookResource::collection($books);
    }

    public function show(NotarialBook $book)
    {
        $this->authorize('view', $book);

        $book->load('createdBy')->loadCount(['templateRecords', 'pageScans', 'legacyFiles']);

        return new NotarialBookResource($book);
    }

    public function store(StoreNotarialBookRequest $request): JsonResponse|NotarialBookResource
    {
        $this->authorize('create', NotarialBook::class);

        $status = $request->string('status')->value() ?: 'archived';

        if ($status === 'active') {
            $activeBook = NotarialBook::query()->where('status', 'active')->first();

            if ($activeBook) {
                return response()->json([
                    'message' => 'There is already an active book (Book '.$activeBook->book_number.', '.$activeBook->year.'). Archive or close it first.',
                ], 422);
            }
        }

        $book = new NotarialBook($request->safe()->except('file'));
        $book->status = $status;
        $book->opened_at = now();
        $book->closed_at = in_array($status, ['full', 'archived'], true) ? now() : null;
        $book->created_by = $request->user()->id;

        $this->storeBookFile($book, $request);
        $book->save();

        $book->load('createdBy')->loadCount(['templateRecords', 'pageScans', 'legacyFiles']);

        return new NotarialBookResource($book);
    }

    public function update(UpdateNotarialBookRequest $request, NotarialBook $book): JsonResponse|NotarialBookResource
    {
        $this->authorize('update', $book);

        $validated = $request->safe()->except('file');

        if (isset($validated['status'])) {
            if ($validated['status'] === 'active') {
                $activeBook = NotarialBook::query()->where('status', 'active')
                    ->where('id', '!=', $book->id)
                    ->first();

                if ($activeBook) {
                    return response()->json([
                        'message' => 'Another book is already active. Close it first.',
                    ], 422);
                }
            }
        }

        $book->fill($validated);

        if (isset($validated['status'])) {
            if (in_array($validated['status'], ['full', 'archived'], true) && ! $book->closed_at) {
                $book->closed_at = now();
            }

            if ($validated['status'] === 'active') {
                $book->closed_at = null;
            }
        }

        $this->storeBookFile($book, $request);
        $book->save();
        $book->load('createdBy')->loadCount(['templateRecords', 'pageScans', 'legacyFiles']);

        return new NotarialBookResource($book);
    }

    public function destroy(NotarialBook $book)
    {
        $this->authorize('delete', $book);

        if ($book->templateRecords()->exists() || $book->pageScans()->exists() || $book->legacyFiles()->exists()) {
            return response()->json([
                'message' => 'This book already has archived files or generated records. Clear those items before deleting the book.',
            ], 409);
        }

        $this->deleteBookFile($book);
        $book->delete();

        return response()->json(['message' => 'Book deleted.'], 200);
    }

    public function downloadScan(NotarialBook $book): StreamedResponse
    {
        $this->authorize('view', $book);

        abort_unless($book->path, 404, 'No scanned file is attached to this notarial book.');

        $disk = self::archiveDisk();
        abort_unless($disk->exists($book->path), 404, 'Scanned file not found on storage.');

        $stream = $disk->readStream($book->path);
        if (! $stream) {
            abort(500, 'Unable to read file stream.');
        }

        return response()->streamDownload(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $book->filename ?? 'notarial-book-scan');
    }

    private function storeBookFile(NotarialBook $book, Request $request): void
    {
        if (! $request->hasFile('file')) {
            return;
        }

        $file = $request->file('file');
        if (! $file) {
            return;
        }

        $this->deleteBookFile($book);

        $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))->slug('_')->value();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $fileName = now()->format('YmdHis')."_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
        $directory = 'notarial-books/'.$request->input('year', $book->year ?? now()->year).'/book-'.$request->input('book_number', $book->book_number ?? 'unknown');

        self::archiveDisk()->putFileAs($directory, $file, $fileName);

        $book->filename = $file->getClientOriginalName();
        $book->path = "{$directory}/{$fileName}";
        $book->disk = self::storageDisk();
        $book->mime_type = $file->getMimeType();
        $book->size_bytes = $file->getSize() ?: 0;
    }

    private function deleteBookFile(NotarialBook $book): void
    {
        if (! $book->path) {
            return;
        }

        $disk = Storage::disk($book->disk ?: self::storageDisk());

        if ($disk->exists($book->path)) {
            $disk->delete($book->path);
        }
    }

    private static function storageDisk(): string
    {
        return (string) config('filesystems.default', 'local');
    }

    private static function archiveDisk(): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk(self::storageDisk());

        return $disk;
    }
}
