<?php

namespace App\Actions\Archives;

use App\Data\Archives\ArchiveZipExportData;
use App\Enums\ArchiveZipExportScope;
use App\Enums\ArchiveZipExportStatus;
use App\Jobs\GenerateArchiveZipExport;
use App\Models\ArchiveZipExport;
use App\Models\User;
use App\Support\Archives\ArchiveFolderZipBuilder;
use App\Support\Archives\ZipExportRequestQuota;
use Illuminate\Support\Str;

class CreateArchiveZipExport
{
    public function __construct(
        private ArchiveFolderZipBuilder $archiveFolderZipBuilder,
        private ZipExportRequestQuota $zipExportRequestQuota,
    ) {}

    public function handle(User $user, ArchiveZipExportData $data): ArchiveZipExport
    {
        $scope = $data->scope;

        if ($scope === ArchiveZipExportScope::Folder && ($data->month === null || $data->type === null)) {
            abort(422, 'Archive folder ZIP exports require a month and type.');
        }

        $existingRequest = ArchiveZipExport::query()
            ->visibleTo($user)
            ->where('scope', $scope->value)
            ->where('year', $data->year)
            ->when(
                $scope === ArchiveZipExportScope::Folder,
                fn ($query) => $query
                    ->where('month', $data->month)
                    ->where('type', $data->type),
                fn ($query) => $query
                    ->whereNull('month')
                    ->whereNull('type'),
            )
            ->where('mine', $data->mine)
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

        $this->zipExportRequestQuota->assertCanCreateFor($user);

        $uuid = (string) Str::uuid();
        $filename = $scope === ArchiveZipExportScope::Folder
            ? $this->archiveFolderZipBuilder->downloadFilename(
                $data->year,
                (int) $data->month,
                (string) $data->type,
            )
            : $this->archiveFolderZipBuilder->yearDownloadFilename($data->year);

        $archiveZipExport = ArchiveZipExport::create([
            'uuid' => $uuid,
            'requested_by' => $user->id,
            'scope' => $scope,
            'year' => $data->year,
            'month' => $scope === ArchiveZipExportScope::Folder ? $data->month : null,
            'type' => $scope === ArchiveZipExportScope::Folder ? $data->type : null,
            'mine' => $data->mine,
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
