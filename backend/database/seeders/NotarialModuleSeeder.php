<?php

namespace Database\Seeders;

use App\Models\LegalParty;
use App\Models\NotarialGeneratedDocument;
use App\Models\NotarialTemplate;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpWord\PhpWord;
use RuntimeException;

class NotarialModuleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->where('email', 'admin@morata.com')->first();
        $paralegal = User::query()->where('email', 'paralegal@morata.com')->first();

        if (! $admin || ! $paralegal) {
            return;
        }

        $readyTemplate = $this->seedReadyTemplate($admin);
        $this->seedPendingTemplate($admin);
        $this->seedGeneratedRecords($readyTemplate, $paralegal);
    }

    private function seedReadyTemplate(User $admin): NotarialTemplate
    {
        $filename = 'affidavit-of-loss-master.docx';
        $path = 'notarial-templates/affidavit_loss/'.$filename;
        $docxContents = $this->buildTemplateDocx([
            'Affidavit of Loss',
            'Party: ${party_name}',
            'Affiant: ${affiant_name}',
            'Lost Item: ${lost_item}',
            'Address: ${principal_address}',
            '${loss_circumstances_clause}',
        ]);

        Storage::disk($this->diskName())->put($path, $docxContents);

        return NotarialTemplate::withoutAuditing(function () use ($admin, $filename, $path, $docxContents): NotarialTemplate {
            return NotarialTemplate::query()->updateOrCreate(
                ['code' => 'affidavit-loss-master'],
                [
                    'label' => 'Affidavit of Loss',
                    'document_code' => 'AFFIDAVIT_LOSS',
                    'document_category' => 'affidavit_oath',
                    'default_notarial_act_type' => 'jurat',
                    'description' => 'Sample master DOCX used for editable affidavit copies.',
                    'is_active' => true,
                    'filename' => $filename,
                    'path' => $path,
                    'disk' => $this->diskName(),
                    'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'size_bytes' => strlen($docxContents),
                    'created_by' => $admin->id,
                ],
            );
        });
    }

    private function seedPendingTemplate(User $admin): void
    {
        NotarialTemplate::withoutAuditing(function () use ($admin): void {
            NotarialTemplate::query()->updateOrCreate(
                ['code' => 'special-power-of-attorney-master'],
                [
                    'label' => 'Special Power of Attorney',
                    'document_code' => 'SPECIAL_POWER_OF_ATTORNEY',
                    'document_category' => 'power_of_attorney',
                    'default_notarial_act_type' => 'acknowledgment',
                    'description' => 'Template definition waiting for the transferred master DOCX.',
                    'is_active' => true,
                    'filename' => null,
                    'path' => null,
                    'disk' => null,
                    'mime_type' => null,
                    'size_bytes' => null,
                    'created_by' => $admin->id,
                ],
            );
        });
    }

    private function seedGeneratedRecords(NotarialTemplate $template, User $paralegal): void
    {
        foreach ([
            [
                'party_name' => 'Maria Santos',
                'principal_address' => 'Rizal Avenue, Tagum City',
                'notes' => 'Editable DOCX copy seeded from the sample affidavit master.',
            ],
            [
                'party_name' => 'Northpoint Trading Corporation',
                'principal_address' => 'JP Laurel Avenue, Davao City',
                'notes' => 'Editable sample output kept in generated documents.',
            ],
        ] as $recordData) {
            $existingRecord = NotarialGeneratedDocument::query()
                ->where('notarial_template_id', $template->id)
                ->where('party_name', $recordData['party_name'])
                ->first();

            if ($existingRecord && $existingRecord->path) {
                Storage::disk($existingRecord->disk ?: $this->diskName())->delete($existingRecord->path);
            }

            $legalParty = LegalParty::query()->updateOrCreate(
                ['name' => $recordData['party_name']],
                ['principal_address' => $recordData['principal_address']],
            );

            $generatedFile = $this->copyTemplateForSeedRecord($template, $recordData['party_name']);

            NotarialGeneratedDocument::withoutAuditing(function () use ($template, $paralegal, $recordData, $generatedFile, $legalParty): void {
                NotarialGeneratedDocument::query()->updateOrCreate(
                    [
                        'notarial_template_id' => $template->id,
                        'party_name' => $recordData['party_name'],
                    ],
                    [
                        'template_code' => $template->code,
                        'template_label' => $template->label,
                        'document_code' => $template->document_code,
                        'document_category' => $template->document_category,
                        'notarial_act_type' => $template->default_notarial_act_type,
                        'legal_party_id' => $legalParty->id,
                        'notes' => $recordData['notes'],
                        'filename' => $generatedFile['filename'],
                        'path' => $generatedFile['path'],
                        'disk' => $generatedFile['disk'],
                        'mime_type' => $generatedFile['mime_type'],
                        'size_bytes' => $generatedFile['size_bytes'],
                        'created_by' => $paralegal->id,
                        'generated_at' => now(),
                    ],
                );
            });
        }
    }

    /**
     * @return array{filename:string,path:string,disk:string,mime_type:string,size_bytes:int}
     */
    private function copyTemplateForSeedRecord(NotarialTemplate $template, string $partyName): array
    {
        $diskName = $template->disk ?: $this->diskName();
        $disk = Storage::disk($diskName);

        if (! $template->path || ! $disk->exists($template->path)) {
            throw new RuntimeException('Unable to locate the sample notarial master template.');
        }

        $filename = now()->format('YmdHis').'_'.str($template->code)->slug('_')->toString().'_'.str($partyName)->slug('_')->toString().'.docx';
        $path = 'notarial-generated/'.now()->format('Y').'/'.$template->code.'/'.$filename;
        $contents = (string) $disk->get($template->path);

        $disk->put($path, $contents);

        return [
            'filename' => $filename,
            'path' => $path,
            'disk' => $diskName,
            'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'size_bytes' => strlen($contents),
        ];
    }

    /**
     * @param  list<string>  $lines
     */
    private function buildTemplateDocx(array $lines): string
    {
        $phpWord = new PhpWord;
        $section = $phpWord->addSection();

        foreach ($lines as $line) {
            $section->addText($line);
        }

        $temporaryPath = tempnam(sys_get_temp_dir(), 'morata_seed_');
        if ($temporaryPath === false) {
            throw new RuntimeException('Unable to create the sample template file.');
        }

        $targetPath = $temporaryPath.'.docx';
        rename($temporaryPath, $targetPath);

        IOFactory::createWriter($phpWord, 'Word2007')->save($targetPath);
        $contents = (string) file_get_contents($targetPath);

        @unlink($targetPath);

        return $contents;
    }

    private function diskName(): string
    {
        return (string) config('filesystems.default', 'local');
    }
}
