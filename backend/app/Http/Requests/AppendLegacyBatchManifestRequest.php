<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AppendLegacyBatchManifestRequest extends FormRequest
{
    private const MAX_FILE_SIZE_BYTES = 52_428_800;

    /**
     * @var list<string>
     */
    private const KNOWN_SYSTEM_FILENAMES = [
        'desktop.ini',
        'thumbs.db',
        'ehthumbs.db',
        '.ds_store',
    ];

    /**
     * @var list<string>
     */
    private const ALLOWED_EXTENSIONS = [
        'pdf',
        'doc',
        'docx',
        'docm',
        'dotm',
        'xls',
        'xlsx',
        'xlsm',
        'xlsb',
        'xltm',
        'xlam',
        'pptm',
        'potm',
        'ppsm',
        'ppam',
        'csv',
        'txt',
        'msg',
        'eml',
        'jpg',
        'jpeg',
        'png',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'list', 'min:1', 'max:250'],
            'files.*.relative_path' => ['required', 'string', 'max:1024'],
            'files.*.size_bytes' => ['required', 'integer', 'min:0'],
            'files.*.mime_type' => ['nullable', 'string', 'max:255'],
            'files.*.modified_at' => ['nullable', 'date'],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $legacyBatch = $this->route('legacyBatch');
                $files = collect($this->input('files', []));

                if (! $legacyBatch || $files->isEmpty()) {
                    return;
                }

                $normalizedPaths = $files
                    ->pluck('relative_path')
                    ->filter(fn ($path): bool => is_string($path) && trim($path) !== '')
                    ->map(fn (string $path): string => trim((string) preg_replace('#/+#', '/', str_replace('\\', '/', $path)), '/'))
                    ->values();

                if ($normalizedPaths->count() !== $normalizedPaths->unique()->count()) {
                    $validator->errors()->add('files', 'Each file in the legacy batch must have a unique relative path within the manifest chunk.');
                }

                $detectedRootFolders = $normalizedPaths
                    ->map(fn (string $path): string => str($path)->before('/')->value())
                    ->unique()
                    ->values();

                if ($detectedRootFolders->count() > 1) {
                    $validator->errors()->add('files', 'All selected files must belong to the same root folder.');
                }

                if ($detectedRootFolders->isNotEmpty() && $detectedRootFolders->first() !== $legacyBatch->root_folder) {
                    $validator->errors()->add('files', 'Manifest chunk files must match the root folder recorded on the legacy batch.');
                }

                $files->values()->each(function (array $file, int $index) use ($validator): void {
                    $normalizedPath = trim((string) preg_replace('#/+#', '/', str_replace('\\', '/', (string) ($file['relative_path'] ?? ''))), '/');
                    $extension = strtolower(pathinfo($normalizedPath, PATHINFO_EXTENSION));
                    $sizeBytes = (int) ($file['size_bytes'] ?? 0);

                    if ($extension === '' || ! in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
                        $validator->errors()->add(
                            "files.{$index}.relative_path",
                            self::unsupportedFileMessage($normalizedPath),
                        );
                    }

                    if ($sizeBytes > self::MAX_FILE_SIZE_BYTES) {
                        $validator->errors()->add(
                            "files.{$index}.size_bytes",
                            'Each legacy file must not be larger than 50 MB.',
                        );
                    }
                });
            },
        ];
    }

    private static function unsupportedFileMessage(string $normalizedPath): string
    {
        $filename = strtolower(pathinfo($normalizedPath, PATHINFO_BASENAME));

        if (in_array($filename, self::KNOWN_SYSTEM_FILENAMES, true) || str_starts_with($filename, '~$')) {
            return "System-generated files such as {$filename} are not supported in legacy uploads. Remove {$normalizedPath} and try again.";
        }

        return 'Only PDF, Office documents, spreadsheets, email message files, text files, and images are allowed in legacy uploads.';
    }
}
