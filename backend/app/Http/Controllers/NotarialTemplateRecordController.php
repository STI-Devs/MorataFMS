<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotarialTemplateRecordRequest;
use App\Http\Resources\NotarialTemplateRecordResource;
use App\Models\LegalParty;
use App\Models\NotarialBook;
use App\Models\NotarialTemplate;
use App\Models\NotarialTemplateRecord;
use App\Services\NotarialTemplates\WordTemplateGenerator;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotarialTemplateRecordController extends Controller
{
    public function __construct(private readonly WordTemplateGenerator $wordTemplateGenerator) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', NotarialTemplateRecord::class);

        $query = NotarialTemplateRecord::query()
            ->with(['template', 'book', 'createdBy'])
            ->latest('generated_at')
            ->latest('created_at');

        if ($request->filled('search')) {
            $search = (string) $request->input('search');

            $query->where(function ($innerQuery) use ($search): void {
                $innerQuery->where('template_label', 'like', "%{$search}%")
                    ->orWhere('template_code', 'like', "%{$search}%")
                    ->orWhere('party_name', 'like', "%{$search}%")
                    ->orWhere('filename', 'like', "%{$search}%");
            });
        }

        if ($request->filled('document_code')) {
            $query->where('document_code', $request->string('document_code')->value());
        }

        if ($request->filled('document_category')) {
            $query->where('document_category', $request->string('document_category')->value());
        }

        if ($request->filled('notarial_act_type')) {
            $query->where('notarial_act_type', $request->string('notarial_act_type')->value());
        }

        if ($request->filled('notarial_template_id')) {
            $query->where('notarial_template_id', $request->integer('notarial_template_id'));
        }

        if ($request->filled('book_id')) {
            $query->where('notarial_book_id', $request->integer('book_id'));
        }

        $records = $query->paginate($request->integer('per_page', 25));

        return NotarialTemplateRecordResource::collection($records);
    }

    public function store(StoreNotarialTemplateRecordRequest $request): JsonResponse
    {
        $this->authorize('create', NotarialTemplateRecord::class);

        /** @var NotarialTemplate $template */
        $template = NotarialTemplate::query()->findOrFail($request->integer('notarial_template_id'));

        if (! $template->is_active) {
            return response()->json([
                'message' => 'This template is inactive and cannot be used for generation.',
            ], 422);
        }

        $book = null;

        if ($request->filled('notarial_book_id')) {
            /** @var NotarialBook $book */
            $book = NotarialBook::query()->findOrFail($request->integer('notarial_book_id'));
            $this->authorize('view', $book);
        }

        $templateData = array_merge(
            $request->input('template_data', []),
            ['party_name' => $request->string('party_name')->value()],
        );

        $templateErrors = $this->validateTemplateData($template, $templateData);
        if ($templateErrors !== []) {
            return response()->json([
                'message' => 'The template data is incomplete.',
                'errors' => $templateErrors,
            ], 422);
        }

        try {
            $generatedFile = $this->wordTemplateGenerator->generate($template, $templateData);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        $record = new NotarialTemplateRecord([
            'notarial_template_id' => $template->id,
            'notarial_book_id' => $book?->id,
            'template_code' => $template->code,
            'template_label' => $template->label,
            'document_code' => $template->document_code,
            'document_category' => $template->document_category,
            'notarial_act_type' => $template->default_notarial_act_type,
            'party_name' => $request->string('party_name')->value(),
            'template_data' => $templateData,
            'notes' => $request->string('notes')->value() ?: null,
            'filename' => $generatedFile['filename'],
            'path' => $generatedFile['path'],
            'disk' => $generatedFile['disk'],
            'mime_type' => $generatedFile['mime_type'],
            'size_bytes' => $generatedFile['size_bytes'],
            'generated_at' => now(),
        ]);
        $record->created_by = $request->user()->id;
        $record->save();
        $this->syncLegalPartyDirectory($record);
        $record->load(['template', 'book', 'createdBy']);

        return (new NotarialTemplateRecordResource($record))
            ->response()
            ->setStatusCode(201);
    }

    public function download(NotarialTemplateRecord $record): StreamedResponse
    {
        $this->authorize('view', $record);

        $disk = self::archiveDisk($record->disk);
        abort_unless($disk->exists($record->path), 404, 'Generated Word file not found on storage.');

        $stream = $disk->readStream($record->path);
        if (! $stream) {
            abort(500, 'Unable to read the generated Word file.');
        }

        return response()->streamDownload(function () use ($stream): void {
            fpassthru($stream);

            if (is_resource($stream)) {
                fclose($stream);
            }
        }, $record->filename);
    }

    /**
     * @param  array<string, mixed>  $templateData
     * @return array<string, list<string>>
     */
    private function validateTemplateData(NotarialTemplate $template, array $templateData): array
    {
        $errors = [];

        foreach ($template->field_schema ?? [] as $fieldDefinition) {
            $name = (string) ($fieldDefinition['name'] ?? '');
            $label = (string) ($fieldDefinition['label'] ?? $name);
            $isRequired = (bool) ($fieldDefinition['required'] ?? false);

            if ($name === '') {
                continue;
            }

            $value = $templateData[$name] ?? null;

            if ($isRequired && ($value === null || $value === '')) {
                $errors["template_data.{$name}"] = ["{$label} is required."];

                continue;
            }

            if (($fieldDefinition['type'] ?? null) === 'select') {
                $options = $fieldDefinition['options'] ?? [];

                if ($value !== null && $value !== '' && is_array($options) && ! in_array($value, $options, true)) {
                    $errors["template_data.{$name}"] = ["{$label} must match one of the allowed options."];
                }
            }
        }

        return $errors;
    }

    private static function archiveDisk(string $diskName): FilesystemAdapter
    {
        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk($diskName);

        return $disk;
    }

    private function syncLegalPartyDirectory(NotarialTemplateRecord $record): void
    {
        $address = collect([
            $record->template_data['principal_address'] ?? null,
            $record->template_data['party_address'] ?? null,
            $record->template_data['address'] ?? null,
        ])->first(fn (mixed $value): bool => is_string($value) && trim($value) !== '');

        $party = LegalParty::query()->firstOrNew(['name' => $record->party_name]);

        if (! $party->exists || (is_string($address) && trim($address) !== '')) {
            $party->principal_address = is_string($address) ? trim($address) : $party->principal_address;
        }

        $party->save();
    }
}
