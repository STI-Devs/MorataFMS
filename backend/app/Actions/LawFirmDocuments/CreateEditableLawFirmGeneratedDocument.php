<?php

namespace App\Actions\LawFirmDocuments;

use App\Enums\LawFirmDocumentModule;
use App\Models\LegalParty;
use App\Models\NotarialGeneratedDocument;
use App\Models\NotarialTemplate;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CreateEditableLawFirmGeneratedDocument
{
    public function handle(array $validated, User $user): NotarialGeneratedDocument
    {
        $module = LawFirmDocumentModule::fromNullable($validated['module'] ?? null);
        /** @var NotarialTemplate $template */
        $template = NotarialTemplate::query()->findOrFail((int) $validated['notarial_template_id']);

        if ($template->module !== $module->value) {
            throw new HttpException(404, 'Document master was not found for this workflow.');
        }

        if (! $template->is_active) {
            throw new HttpException(422, 'This document master is inactive and cannot be edited.');
        }

        if (! $template->path || ! $template->disk) {
            throw new HttpException(422, 'This document master does not have an uploaded DOCX file.');
        }

        $sourceDisk = Storage::disk($template->disk);

        if (! $sourceDisk->exists($template->path)) {
            throw new HttpException(422, 'The uploaded document master file could not be found.');
        }

        $legalParty = isset($validated['party_id'])
            ? LegalParty::query()->findOrFail((int) $validated['party_id'])
            : null;

        $filename = $this->workingCopyFilename($template, (string) $validated['party_name']);
        $path = $module->storagePrefix().'-generated/'.now()->format('Y').'/'.$template->code.'/'.$filename;
        $contents = (string) $sourceDisk->get($template->path);

        if (! $sourceDisk->put($path, $contents)) {
            throw new RuntimeException('Unable to create the editable document copy.');
        }

        $record = new NotarialGeneratedDocument([
            'module' => $module->value,
            'notarial_template_id' => $template->id,
            'template_code' => $template->code,
            'template_label' => $template->label,
            'document_code' => $template->document_code,
            'document_category' => $template->document_category,
            'notarial_act_type' => $template->default_notarial_act_type,
            'party_name' => (string) $validated['party_name'],
            'legal_party_id' => $legalParty?->id,
            'notes' => isset($validated['notes']) && $validated['notes'] !== ''
                ? (string) $validated['notes']
                : null,
            'filename' => $filename,
            'path' => $path,
            'disk' => $template->disk,
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'size_bytes' => strlen($contents),
            'generated_at' => now(),
        ]);
        $record->created_by = $user->id;
        $record->save();

        $this->syncLegalPartyDirectory($record, $legalParty);

        $record->load(['template', 'createdBy', 'legalParty']);

        return $record;
    }

    private function workingCopyFilename(NotarialTemplate $template, string $partyName): string
    {
        $partySlug = Str::slug($partyName) ?: 'walk-in';
        $templateSlug = Str::slug($template->code ?: $template->label, '_') ?: 'document';

        return now()->format('YmdHis')."_{$templateSlug}_{$partySlug}_".Str::lower(Str::random(8)).'.docx';
    }

    private function syncLegalPartyDirectory(NotarialGeneratedDocument $record, ?LegalParty $legalParty = null): void
    {
        $party = $legalParty ?? LegalParty::query()->firstOrNew(['name' => $record->party_name]);

        if (! $party->exists) {
            $party->name = $record->party_name;
            $party->save();
        }

        if ($record->legal_party_id !== $party->id) {
            $record->legal_party_id = $party->id;
            $record->save();
        }
    }
}
