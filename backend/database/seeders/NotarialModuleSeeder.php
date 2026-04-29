<?php

namespace Database\Seeders;

use App\Models\LegalParty;
use App\Models\NotarialBook;
use App\Models\NotarialLegacyFile;
use App\Models\NotarialPageScan;
use App\Models\NotarialTemplate;
use App\Models\NotarialTemplateRecord;
use App\Models\User;
use App\Services\NotarialTemplates\WordTemplateGenerator;
use Carbon\Carbon;
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

        $legacyBook = NotarialBook::withoutAuditing(function () use ($admin): NotarialBook {
            return NotarialBook::query()->firstOrCreate(
                ['book_number' => 1, 'year' => 2025],
                [
                    'status' => 'archived',
                    'notes' => 'Historical Book 1 archive for scanned pages and imported files.',
                    'opened_at' => Carbon::create(2025, 1, 1, 8, 0, 0),
                    'closed_at' => Carbon::create(2025, 12, 31, 17, 0, 0),
                    'created_by' => $admin->id,
                ],
            );
        });

        $currentBook = NotarialBook::withoutAuditing(function () use ($admin): NotarialBook {
            return NotarialBook::query()->firstOrCreate(
                ['book_number' => 2, 'year' => 2026],
                [
                    'status' => 'active',
                    'notes' => 'Current physical book used for archived scans and optional generated-record linkage.',
                    'opened_at' => Carbon::create(2026, 1, 2, 8, 0, 0),
                    'closed_at' => null,
                    'created_by' => $admin->id,
                ],
            );
        });

        $this->seedLegacyFiles($legacyBook, $paralegal);
        $this->seedBookPageScans($currentBook, $paralegal);

        $readyTemplate = $this->seedReadyTemplate($admin);
        $this->seedPendingTemplate($admin);
        $this->seedGeneratedRecords($readyTemplate, $currentBook, $paralegal);
    }

    private function seedLegacyFiles(NotarialBook $book, User $paralegal): void
    {
        foreach ([
            ['filename' => 'book-1-pages-001-050.pdf', 'title' => 'Book 1 scanned pages 1 to 50'],
            ['filename' => 'book-1-pages-051-100.pdf', 'title' => 'Book 1 scanned pages 51 to 100'],
        ] as $legacyFile) {
            $path = 'notarial-legacy-files/2025/book-001/'.$legacyFile['filename'];
            $contents = $this->storeSamplePdf($path, $legacyFile['title']);

            NotarialLegacyFile::withoutAuditing(function () use ($book, $paralegal, $legacyFile, $path, $contents): void {
                NotarialLegacyFile::query()->firstOrCreate(
                    [
                        'notarial_book_id' => $book->id,
                        'path' => $path,
                    ],
                    [
                        'filename' => $legacyFile['filename'],
                        'disk' => $this->diskName(),
                        'mime_type' => 'application/pdf',
                        'size_bytes' => strlen($contents),
                        'uploaded_by' => $paralegal->id,
                    ],
                );
            });
        }
    }

    private function seedBookPageScans(NotarialBook $book, User $paralegal): void
    {
        foreach ([
            [
                'page_start' => 1,
                'page_end' => 10,
                'filename' => 'book-2-pages-001-010.pdf',
                'title' => 'Book 2 page-indexed scan 1 to 10',
            ],
            [
                'page_start' => 11,
                'page_end' => 20,
                'filename' => 'book-2-pages-011-020.pdf',
                'title' => 'Book 2 page-indexed scan 11 to 20',
            ],
        ] as $scan) {
            $path = 'notarial-page-scans/2026/book-002/'.$scan['filename'];
            $contents = $this->storeSamplePdf($path, $scan['title']);

            NotarialPageScan::withoutAuditing(function () use ($book, $paralegal, $scan, $path, $contents): void {
                NotarialPageScan::query()->firstOrCreate(
                    [
                        'notarial_book_id' => $book->id,
                        'page_start' => $scan['page_start'],
                        'page_end' => $scan['page_end'],
                    ],
                    [
                        'filename' => $scan['filename'],
                        'path' => $path,
                        'disk' => $this->diskName(),
                        'mime_type' => 'application/pdf',
                        'size_bytes' => strlen($contents),
                        'uploaded_by' => $paralegal->id,
                    ],
                );
            });
        }
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
                    'description' => 'Sample master template for affidavit generation.',
                    'field_schema' => [
                        [
                            'name' => 'affiant_name',
                            'label' => 'Affiant Name',
                            'type' => 'text',
                            'required' => true,
                        ],
                        [
                            'name' => 'lost_item',
                            'label' => 'Lost Item',
                            'type' => 'text',
                            'required' => true,
                        ],
                        [
                            'name' => 'principal_address',
                            'label' => 'Address',
                            'type' => 'text',
                            'required' => false,
                        ],
                    ],
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
                    'description' => 'Placeholder template definition waiting for the transferred master DOCX.',
                    'field_schema' => [
                        [
                            'name' => 'principal_name',
                            'label' => 'Principal Name',
                            'type' => 'text',
                            'required' => true,
                        ],
                        [
                            'name' => 'agent_name',
                            'label' => 'Agent Name',
                            'type' => 'text',
                            'required' => true,
                        ],
                    ],
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

    private function seedGeneratedRecords(NotarialTemplate $template, NotarialBook $book, User $paralegal): void
    {
        $generator = app(WordTemplateGenerator::class);

        foreach ([
            [
                'party_name' => 'Maria Santos',
                'template_data' => [
                    'party_name' => 'Maria Santos',
                    'affiant_name' => 'Maria Santos',
                    'lost_item' => 'Passport',
                    'principal_address' => 'Rizal Avenue, Tagum City',
                ],
                'notes' => 'Generated from the sample affidavit master.',
                'book_id' => $book->id,
            ],
            [
                'party_name' => 'Northpoint Trading Corporation',
                'template_data' => [
                    'party_name' => 'Northpoint Trading Corporation',
                    'affiant_name' => 'Ana Velasco',
                    'lost_item' => 'Secretary Certificate',
                    'principal_address' => 'JP Laurel Avenue, Davao City',
                ],
                'notes' => 'Generated sample output kept without a book-link override.',
                'book_id' => null,
            ],
        ] as $recordData) {
            $existingRecord = NotarialTemplateRecord::query()
                ->where('notarial_template_id', $template->id)
                ->where('party_name', $recordData['party_name'])
                ->first();

            if ($existingRecord && $existingRecord->path) {
                Storage::disk($existingRecord->disk ?: $this->diskName())->delete($existingRecord->path);
            }

            $generatedFile = $generator->generate($template, $recordData['template_data']);

            NotarialTemplateRecord::withoutAuditing(function () use ($template, $paralegal, $recordData, $generatedFile): void {
                NotarialTemplateRecord::query()->updateOrCreate(
                    [
                        'notarial_template_id' => $template->id,
                        'party_name' => $recordData['party_name'],
                    ],
                    [
                        'notarial_book_id' => $recordData['book_id'],
                        'template_code' => $template->code,
                        'template_label' => $template->label,
                        'document_code' => $template->document_code,
                        'document_category' => $template->document_category,
                        'notarial_act_type' => $template->default_notarial_act_type,
                        'template_data' => $recordData['template_data'],
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

            LegalParty::query()->updateOrCreate(
                ['name' => $recordData['party_name']],
                ['principal_address' => $recordData['template_data']['principal_address']],
            );
        }
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

    private function storeSamplePdf(string $path, string $title): string
    {
        $contents = $this->samplePdfContents($title);

        Storage::disk($this->diskName())->put($path, $contents);

        return $contents;
    }

    private function samplePdfContents(string $title): string
    {
        $safeTitle = preg_replace('/[^A-Za-z0-9 .\\-]/', '', $title) ?: 'Morata FMS Sample PDF';
        $streamText = "BT /F1 18 Tf 72 720 Td ({$safeTitle}) Tj ET";
        $length = strlen($streamText);

        return "%PDF-1.4\n"
            ."1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            ."2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            ."3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
            ."4 0 obj << /Length {$length} >> stream\n{$streamText}\nendstream endobj\n"
            ."5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
            ."xref\n0 6\n0000000000 65535 f \n"
            ."0000000010 00000 n \n"
            ."0000000063 00000 n \n"
            ."0000000122 00000 n \n"
            ."0000000248 00000 n \n"
            ."0000000344 00000 n \n"
            ."trailer << /Size 6 /Root 1 0 R >>\nstartxref\n414\n%%EOF";
    }

    private function diskName(): string
    {
        return (string) config('filesystems.default', 'local');
    }
}
