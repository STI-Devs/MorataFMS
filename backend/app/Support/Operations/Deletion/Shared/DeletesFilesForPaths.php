<?php

namespace App\Support\Operations\Deletion\Shared;

use Illuminate\Support\Facades\Storage;

class DeletesFilesForPaths
{
    /**
     * @param  list<string>  $paths
     * @return array{deleted_file_count: int, failed_file_deletions: list<string>}
     */
    public function delete(string $diskName, array $paths): array
    {
        $deletedFileCount = 0;
        $failedFileDeletions = [];
        $disk = Storage::disk($diskName);

        foreach ($paths as $path) {
            if ($disk->delete($path)) {
                $deletedFileCount++;
            } else {
                $failedFileDeletions[] = $path;
            }
        }

        return [
            'deleted_file_count' => $deletedFileCount,
            'failed_file_deletions' => $failedFileDeletions,
        ];
    }
}
