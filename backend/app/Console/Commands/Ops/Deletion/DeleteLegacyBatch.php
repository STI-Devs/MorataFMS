<?php

namespace App\Console\Commands\Ops\Deletion;

use App\Models\LegacyBatch;
use App\Support\LegacyBatches\LegacyBatchDeletionExecutor;
use Illuminate\Console\Command;

class DeleteLegacyBatch extends Command
{
    protected $signature = 'ops:delete-legacy-batch
                            {uuid : Legacy batch UUID}
                            {--connection= : Database connection name for this delete run}
                            {--dry-run : Preview the delete scope without changing data}
                            {--force : Required in production and skips the interactive confirmation}';

    protected $description = 'Permanently delete a legacy batch from storage and the database without leaving orphaned objects behind.';

    public function __construct(
        private LegacyBatchDeletionExecutor $legacyBatchDeletionExecutor,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $connectionName = $this->resolveConnectionName();

        if (! array_key_exists($connectionName, config('database.connections'))) {
            $this->error("The database connection [{$connectionName}] is not configured.");

            return self::FAILURE;
        }

        if (app()->isProduction() && ! $this->option('force')) {
            $this->error('This command is destructive in production. Re-run it with --force after reviewing the scope.');

            return self::FAILURE;
        }

        $legacyBatch = LegacyBatch::on($connectionName)
            ->where('uuid', (string) $this->argument('uuid'))
            ->first();

        if (! $legacyBatch instanceof LegacyBatch) {
            $this->error('The selected legacy batch could not be found.');

            return self::FAILURE;
        }

        $inspection = $this->legacyBatchDeletionExecutor->inspect($legacyBatch);

        $this->info("Delete scope for legacy batch [{$legacyBatch->uuid}]");
        $this->line('Database connection: '.$connectionName);
        $this->line('Batch name: '.$legacyBatch->batch_name);
        $this->line('Root folder: '.$legacyBatch->root_folder);
        $this->line('Status: '.$legacyBatch->status->value);
        $this->line('Storage disk: '.$inspection['storage_disk']);
        $this->line('Storage prefix: '.$inspection['storage_prefix']);
        $this->newLine();

        $this->line('Database file count: '.$inspection['database_file_count']);
        $this->line('Storage object count: '.$inspection['storage_object_count']);
        $this->line('Orphan storage object count: '.$inspection['orphan_storage_object_count']);
        $this->line('Missing storage object count: '.$inspection['missing_storage_object_count']);

        if ($inspection['orphan_storage_paths'] !== []) {
            $this->warn('Orphan storage objects that will be purged:');
            foreach ($inspection['orphan_storage_paths'] as $path) {
                $this->line('- '.$path);
            }
        }

        if ($inspection['missing_storage_paths'] !== []) {
            $this->warn('Database rows that point to missing storage objects:');
            foreach ($inspection['missing_storage_paths'] as $path) {
                $this->line('- '.$path);
            }
        }

        if ($this->option('dry-run')) {
            $this->warn('Dry run only. No data was deleted.');

            return self::SUCCESS;
        }

        if (! $this->option('force') && ! $this->confirm('This will permanently delete the legacy batch from storage and the database. Continue?')) {
            $this->warn('Operation cancelled. No data was deleted.');

            return self::FAILURE;
        }

        $result = $this->legacyBatchDeletionExecutor->delete($legacyBatch);

        if ($result['failed_file_deletions'] !== []) {
            $this->error('The legacy batch could not be fully deleted from storage. Database rows were left intact.');

            foreach ($result['failed_file_deletions'] as $path) {
                $this->line('- '.$path);
            }

            return self::FAILURE;
        }

        $this->info("Deletion complete for legacy batch [{$legacyBatch->uuid}].");
        $this->line('Deleted storage object count: '.$result['deleted_storage_object_count']);
        $this->line('Deleted file record count: '.$result['deleted_file_record_count']);
        $this->line('Deleted batch count: '.$result['deleted_batch_count']);
        $this->line('Deleted audit log count: '.$result['audit_log_count']);

        return self::SUCCESS;
    }

    private function resolveConnectionName(): string
    {
        $selectedConnection = trim((string) $this->option('connection'));

        if ($selectedConnection !== '') {
            return $selectedConnection;
        }

        return (string) config('database.default');
    }
}
