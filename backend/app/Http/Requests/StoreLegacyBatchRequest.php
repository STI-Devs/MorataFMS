<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreLegacyBatchRequest extends FormRequest
{
    private const MAX_FILE_SIZE_BYTES = 52_428_800;

    /**
     * @var list<string>
     */
    private const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'jpg', 'jpeg', 'png'];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'batch_name' => ['required', 'string', 'max:160'],
            'root_folder' => ['required', 'string', 'max:255'],
            'year' => ['required', 'integer', 'min:2000', 'max:'.now()->year],
            'department' => ['required', 'string', 'max:60'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'files' => ['required', 'array', 'list', 'min:1'],
            'files.*.relative_path' => ['required', 'string', 'max:1024'],
            'files.*.size_bytes' => ['required', 'integer', 'min:1'],
            'files.*.mime_type' => ['nullable', 'string', 'max:255'],
            'files.*.modified_at' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'batch_name.required' => 'Batch name is required.',
            'root_folder.required' => 'Root folder is required.',
            'year.required' => 'Year is required.',
            'department.required' => 'Department is required.',
            'files.required' => 'Select at least one file before creating the legacy batch.',
            'files.min' => 'Select at least one file before creating the legacy batch.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $files = collect($this->input('files', []));

                if ($files->isEmpty()) {
                    return;
                }

                $normalizedPaths = $files
                    ->pluck('relative_path')
                    ->filter(fn ($path): bool => is_string($path) && trim($path) !== '')
                    ->map(fn (string $path): string => trim((string) preg_replace('#/+#', '/', str_replace('\\', '/', $path)), '/'))
                    ->values();

                if ($normalizedPaths->count() !== $normalizedPaths->unique()->count()) {
                    $validator->errors()->add('files', 'Each file in the legacy batch must have a unique relative path.');
                }

                $rootFolder = trim((string) $this->input('root_folder'));
                $detectedRootFolders = $normalizedPaths
                    ->map(fn (string $path): string => str($path)->before('/')->value())
                    ->unique()
                    ->values();

                if ($detectedRootFolders->count() > 1) {
                    $validator->errors()->add('files', 'All selected files must belong to the same root folder.');
                }

                if ($detectedRootFolders->isNotEmpty() && $detectedRootFolders->first() !== $rootFolder) {
                    $validator->errors()->add('root_folder', 'Root folder must match the first segment of every selected file path.');
                }

                $files->values()->each(function (array $file, int $index) use ($validator): void {
                    $normalizedPath = trim((string) preg_replace('#/+#', '/', str_replace('\\', '/', (string) ($file['relative_path'] ?? ''))), '/');
                    $extension = strtolower(pathinfo($normalizedPath, PATHINFO_EXTENSION));
                    $sizeBytes = (int) ($file['size_bytes'] ?? 0);

                    if ($extension === '' || ! in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
                        $validator->errors()->add(
                            "files.{$index}.relative_path",
                            'Only PDF, Office documents, spreadsheets, text files, and images are allowed in legacy uploads.',
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
}
