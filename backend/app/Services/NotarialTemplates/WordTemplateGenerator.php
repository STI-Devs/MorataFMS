<?php

namespace App\Services\NotarialTemplates;

use App\Models\NotarialTemplate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpWord\TemplateProcessor;
use RuntimeException;

class WordTemplateGenerator
{
    /**
     * @param  array<string, mixed>  $templateData
     * @return array{filename:string,path:string,disk:string,mime_type:string,size_bytes:int}
     */
    public function generate(NotarialTemplate $template, array $templateData): array
    {
        if (! $template->path || ! $template->disk) {
            throw new RuntimeException('This template does not have an uploaded Word file yet.');
        }

        $disk = Storage::disk($template->disk);

        if (! $disk->exists($template->path)) {
            throw new RuntimeException('The uploaded Word template file could not be found.');
        }

        $sourcePath = $this->writeTempFile('.docx', (string) $disk->get($template->path));
        $outputPath = $this->tempOutputPath();

        try {
            $processor = new TemplateProcessor($sourcePath);

            foreach ($this->flattenTemplateData($templateData) as $placeholder => $value) {
                $processor->setValue($placeholder, $this->normalizeValue($value));
            }

            $processor->saveAs($outputPath);

            $generatedFilename = now()->format('YmdHis').'_'.Str::slug($template->code ?: $template->label, '_').'_'.Str::lower(Str::random(8)).'.docx';
            $generatedPath = 'notarial-generated/'.now()->format('Y').'/'.$template->code.'/'.$generatedFilename;
            $generatedContents = (string) file_get_contents($outputPath);

            $disk->put($generatedPath, $generatedContents);

            return [
                'filename' => $generatedFilename,
                'path' => $generatedPath,
                'disk' => $template->disk,
                'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'size_bytes' => strlen($generatedContents),
            ];
        } finally {
            @unlink($sourcePath);
            @unlink($outputPath);
        }
    }

    /**
     * @param  array<string, mixed>  $templateData
     * @return array<string, string>
     */
    private function flattenTemplateData(array $templateData): array
    {
        $flattened = [];

        foreach ($templateData as $key => $value) {
            if (! is_string($key) || $key === '') {
                continue;
            }

            $flattened[$key] = $this->normalizeValue($value);
        }

        return $flattened;
    }

    private function normalizeValue(mixed $value): string
    {
        if (is_array($value)) {
            return implode(', ', array_map(fn (mixed $item): string => $this->normalizeValue($item), $value));
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('F j, Y');
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return trim((string) $value);
    }

    private function writeTempFile(string $suffix, string $contents): string
    {
        $path = tempnam(sys_get_temp_dir(), 'morata_tpl_');

        if ($path === false) {
            throw new RuntimeException('Unable to create a temporary template file.');
        }

        $target = $path.$suffix;
        rename($path, $target);
        file_put_contents($target, $contents);

        return $target;
    }

    private function tempOutputPath(): string
    {
        $path = tempnam(sys_get_temp_dir(), 'morata_out_');

        if ($path === false) {
            throw new RuntimeException('Unable to create a temporary output file.');
        }

        @unlink($path);

        return $path.'.docx';
    }
}
