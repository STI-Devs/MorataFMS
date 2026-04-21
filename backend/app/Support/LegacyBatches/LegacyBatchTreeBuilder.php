<?php

namespace App\Support\LegacyBatches;

use App\Models\LegacyBatch;
use App\Models\LegacyBatchFile;
use Illuminate\Support\Collection;

class LegacyBatchTreeBuilder
{
    /**
     * @return array<string, mixed>
     */
    public function build(LegacyBatch $batch): array
    {
        $tree = [
            'name' => $batch->root_folder,
            'type' => 'folder',
            'children' => [],
        ];

        $files = $batch->relationLoaded('files')
            ? $batch->files
            : $batch->files()->orderBy('relative_path')->get();

        foreach ($files as $file) {
            $this->appendFile($tree, $batch, $file);
        }

        return $this->sortTree($tree);
    }

    /**
     * @param  array<string, mixed>  $tree
     */
    private function appendFile(array &$tree, LegacyBatch $batch, LegacyBatchFile $file): void
    {
        $parts = collect(explode('/', str_replace('\\', '/', $file->relative_path)))
            ->filter(fn (string $segment): bool => $segment !== '')
            ->values();

        if ($parts->isEmpty()) {
            return;
        }

        if ($parts->first() === $batch->root_folder) {
            $parts = $parts->slice(1)->values();
        }

        if ($parts->isEmpty()) {
            return;
        }

        $children = &$tree['children'];
        $lastIndex = $parts->count() - 1;

        foreach ($parts as $index => $part) {
            if ($index === $lastIndex) {
                $children[] = [
                    'id' => (string) $file->id,
                    'name' => $part,
                    'type' => 'file',
                    'size' => $this->formatBytes($file->size_bytes),
                    'modified' => $file->modified_at?->format('M j, Y'),
                    'status' => $file->status->value,
                ];

                return;
            }

            $folderIndex = $this->findFolderIndex($children, $part);

            if ($folderIndex === null) {
                $children[] = [
                    'name' => $part,
                    'type' => 'folder',
                    'children' => [],
                ];
                $folderIndex = array_key_last($children);
            }

            $children = &$children[$folderIndex]['children'];
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $children
     */
    private function findFolderIndex(array $children, string $folderName): ?int
    {
        foreach ($children as $index => $child) {
            if (($child['type'] ?? null) === 'folder' && ($child['name'] ?? null) === $folderName) {
                return $index;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $node
     * @return array<string, mixed>
     */
    private function sortTree(array $node): array
    {
        $children = Collection::make($node['children'] ?? [])
            ->map(function (array $child): array {
                if (($child['type'] ?? null) === 'folder') {
                    return $this->sortTree($child);
                }

                return $child;
            })
            ->sortBy([
                fn (array $child): int => ($child['type'] ?? null) === 'folder' ? 0 : 1,
                fn (array $child): string => strtolower((string) ($child['name'] ?? '')),
            ])
            ->values()
            ->all();

        $node['children'] = $children;

        return $node;
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }

        if ($bytes < 1_048_576) {
            return round($bytes / 1024, 2).' KB';
        }

        if ($bytes < 1_073_741_824) {
            return round($bytes / 1_048_576, 2).' MB';
        }

        return round($bytes / 1_073_741_824, 2).' GB';
    }
}
