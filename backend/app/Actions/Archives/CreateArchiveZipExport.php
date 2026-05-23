<?php

namespace App\Actions\Archives;

use App\Enums\ArchiveZipExportScope;
use App\Enums\ArchiveZipExportStatus;
use App\Jobs\GenerateArchiveZipExport;
use App\Models\ArchiveZipExport;
use App\Models\User;
use App\Support\Archives\ArchiveFolderZipBuilder;
use Illuminate\Support\Str;

class CreateArchiveZipExport
{
    public function __construct(
        private ArchiveFolderZipBuilder $archiveFolderZipBuilder,
    ) {}

    /**
     * @param  array{scope:string, year:int, month:int, type:string, mine:bool}  $validated
     */
    public function handle(User $user, array $validated): ArchiveZipExport
    {
        $scope = ArchiveZipExportScope::from($validated['scope']);

        if ($scope !== ArchiveZipExportScope::Folder) {
            abort(422, 'Only archive folder ZIP exports are supported right now.');
        }

        $existingRequest = ArchiveZipExport::query()
            ->visibleTo($user)
            ->where('scope', $scope->value)
            ->where('year', $validated['year'])
            ->where('month', $validated['month'])
            ->where('type', $validated['type'])
            ->where('mine', $validated['mine'])
            ->whereIn('status', [
                ArchiveZipExportStatus::Pending->value,
                ArchiveZipExportStatus::Processing->value,
                ArchiveZipExportStatus::Ready->value,
            ])
            ->where(function ($query): void {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->first();

        if ($existingRequest instanceof ArchiveZipExport) {
            return $existingRequest->loadMissing('requestedBy');
        }

        $uuid = (string) Str::uuid();
        $filename = $this->archiveFolderZipBuilder->downloadFilename(
            $validated['year'],
            $validated['month'],
            $validated['type'],
        );

        $archiveZipExport = ArchiveZipExport::create([
            'uuid' => $uuid,
            'requested_by' => $user->id,
            'scope' => $scope,
            'year' => $validated['year'],
            'month' => $validated['month'],
            'type' => $validated['type'],
            'mine' => $validated['mine'],
            'status' => ArchiveZipExportStatus::Pending,
            'storage_disk' => (string) config('filesystems.default', 'local'),
            'file_path' => "archive-zip-exports/{$uuid}/{$filename}",
            'filename' => $filename,
            'expires_at' => now()->addHours(ArchiveZipExport::EXPIRATION_HOURS),
        ]);

        GenerateArchiveZipExport::dispatch($archiveZipExport->id)->afterCommit();

        return $archiveZipExport->loadMissing('requestedBy');
    }
}
