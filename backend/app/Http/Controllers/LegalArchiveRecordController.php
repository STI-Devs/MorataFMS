<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLegalArchiveRecordRequest;
use App\Http\Resources\LegalArchiveRecordResource;
use App\Models\LegalArchiveRecord;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegalArchiveRecordController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', LegalArchiveRecord::class);

        $query = LegalArchiveRecord::query()
            ->with('createdBy')
            ->latest('document_date')
            ->latest('created_at');

        if ($request->filled('search')) {
            $search = (string) $request->input('search');

            $query->where(function ($innerQuery) use ($search): void {
                $innerQuery->where('title', 'like', "%{$search}%")
                    ->orWhere('related_name', 'like', "%{$search}%")
                    ->orWhere('filename', 'like', "%{$search}%");
            });
        }

        if ($request->filled('file_category')) {
            $query->where('file_category', $request->string('file_category')->value());
        }

        if ($request->filled('file_code')) {
            $query->where('file_code', $request->string('file_code')->value());
        }

        if ($request->filled('upload_status')) {
            if ($request->string('upload_status')->value() === 'uploaded') {
                $query->whereNotNull('path');
            }

            if ($request->string('upload_status')->value() === 'missing_upload') {
                $query->whereNull('path');
            }
        }

        $records = $query->paginate($request->integer('per_page', 25));

        return LegalArchiveRecordResource::collection($records);
    }

    public function store(StoreLegalArchiveRecordRequest $request): JsonResponse
    {
        $this->authorize('create', LegalArchiveRecord::class);

        $record = new LegalArchiveRecord($request->safe()->except('file'));
        $record->created_by = $request->user()->id;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))->slug('_')->value();
            $extension = strtolower((string) $file->getClientOriginalExtension());
            $fileName = now()->format('YmdHis')."_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
            $directory = 'legal-archive/'.now()->format('Y').'/'.Str::slug($request->input('file_category'));

            self::archiveDisk()->putFileAs($directory, $file, $fileName);

            $record->filename = $file->getClientOriginalName();
            $record->path = "{$directory}/{$fileName}";
            $record->disk = self::storageDisk();
            $record->mime_type = $file->getMimeType();
            $record->size_bytes = $file->getSize() ?: 0;
        }

        $record->save();
        $record->load('createdBy');

        return (new LegalArchiveRecordResource($record))
            ->response()
            ->setStatusCode(201);
    }

    public function download(LegalArchiveRecord $record): StreamedResponse
    {
        $this->authorize('view', $record);

        abort_unless($record->path, 404, 'File not found for this legal archive record.');

        $disk = self::archiveDisk();
        abort_unless($disk->exists($record->path), 404, 'File not found on storage.');

        $stream = $disk->readStream($record->path);
        if (! $stream) {
            abort(500, 'Unable to read file stream.');
        }

        return response()->streamDownload(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $record->filename ?? 'legal-file');
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
