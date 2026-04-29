<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotarialTemplateRequest;
use App\Http\Requests\UpdateNotarialTemplateRequest;
use App\Http\Resources\NotarialTemplateResource;
use App\Models\NotarialTemplate;
use App\Support\Legal\LegalDocumentCatalog;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialTemplateController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialTemplate::class);

        $query = NotarialTemplate::query()
            ->with('createdBy')
            ->orderBy('label');

        if ($request->filled('search')) {
            $search = (string) $request->input('search');

            $query->where(function ($innerQuery) use ($search): void {
                $innerQuery->where('label', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('document_code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('document_code')) {
            $query->where('document_code', $request->string('document_code')->value());
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->filled('template_status')) {
            if ($request->string('template_status')->value() === 'ready') {
                $query->whereNotNull('path');
            }

            if ($request->string('template_status')->value() === 'missing_file') {
                $query->whereNull('path');
            }
        }

        $templates = $query->paginate($request->integer('per_page', 25));

        return NotarialTemplateResource::collection($templates);
    }

    public function store(StoreNotarialTemplateRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialTemplate::class);

        $template = new NotarialTemplate($request->safe()->except('file'));
        $template->document_category = LegalDocumentCatalog::categoryForCode($template->document_code) ?? 'other';
        $template->default_notarial_act_type = $template->default_notarial_act_type
            ?: (LegalDocumentCatalog::defaultNotarialActTypeForCode($template->document_code) ?? 'acknowledgment');
        $template->is_active = $request->boolean('is_active', true);
        $template->created_by = $request->user()->id;

        $this->storeTemplateFile($template, $request);

        $template->save();
        $template->load('createdBy');

        return (new NotarialTemplateResource($template))
            ->response()
            ->setStatusCode(201);
    }

    public function show(NotarialTemplate $template): NotarialTemplateResource
    {
        $this->authorize('view', $template);

        $template->load('createdBy');

        return new NotarialTemplateResource($template);
    }

    public function update(UpdateNotarialTemplateRequest $request, NotarialTemplate $template): NotarialTemplateResource
    {
        $this->authorize('update', $template);

        $template->fill($request->safe()->except('file'));

        if ($template->document_code) {
            $template->document_category = LegalDocumentCatalog::categoryForCode($template->document_code) ?? 'other';
            $template->default_notarial_act_type = $template->default_notarial_act_type
                ?: (LegalDocumentCatalog::defaultNotarialActTypeForCode($template->document_code) ?? 'acknowledgment');
        }

        $this->storeTemplateFile($template, $request);

        $template->save();
        $template->load('createdBy');

        return new NotarialTemplateResource($template);
    }

    public function destroy(NotarialTemplate $template): JsonResponse
    {
        $this->authorize('delete', $template);

        if ($template->records()->exists()) {
            return response()->json([
                'message' => 'Generated records already exist for this template. Archive it instead of deleting.',
            ], 409);
        }

        $this->deleteTemplateFile($template);
        $template->delete();

        return response()->json(['message' => 'Template deleted.']);
    }

    public function download(NotarialTemplate $template): StreamedResponse
    {
        $this->authorize('view', $template);

        abort_unless($template->path && $template->disk, 404, 'No Word template file is attached to this template.');

        $disk = Storage::disk($template->disk);
        abort_unless($disk->exists($template->path), 404, 'Word template file not found on storage.');

        $stream = $disk->readStream($template->path);
        if (! $stream) {
            abort(500, 'Unable to read the template file stream.');
        }

        return response()->streamDownload(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $template->filename ?? 'notarial-template.docx');
    }

    private function storeTemplateFile(NotarialTemplate $template, Request $request): void
    {
        if (! $request->hasFile('file')) {
            return;
        }

        $file = $request->file('file');
        if (! $file) {
            return;
        }

        $this->deleteTemplateFile($template);

        $safeName = Str::of(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME))->slug('_')->value();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $fileName = now()->format('YmdHis')."_{$safeName}_".Str::lower(Str::random(8)).".{$extension}";
        $directory = 'notarial-templates/'.Str::slug($request->input('document_code', $template->document_code ?? 'general'));

        self::archiveDisk()->putFileAs($directory, $file, $fileName);

        $template->filename = $file->getClientOriginalName();
        $template->path = "{$directory}/{$fileName}";
        $template->disk = self::storageDisk();
        $template->mime_type = $file->getMimeType();
        $template->size_bytes = $file->getSize() ?: 0;
    }

    private function deleteTemplateFile(NotarialTemplate $template): void
    {
        if (! $template->path) {
            return;
        }

        $disk = Storage::disk($template->disk ?: self::storageDisk());

        if ($disk->exists($template->path)) {
            $disk->delete($template->path);
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
