<?php

namespace App\Console\Commands\Ops;

use App\Enums\LegacyBatchModule;
use App\Support\LegacyBatches\LegacyBatchStoragePathMigrator;
use Illuminate\Console\Command;
use InvalidArgumentException;
use Throwable;

class MigrateLegacyBatchStoragePaths extends Command
{
    protected $signature = 'ops:migrate-legacy-batch-storage-paths
                            {--connection= : Database connection name for this migration run}
                            {--module= : Optional module filter: brokerage, notarial, or legal}
                            {--batch= : Optional legacy batch UUID filter}
                            {--dry-run : Preview object moves and database updates without changing data}
                            {--force : Required in production and skips the interactive confirmation}';

    protected $description = 'Move legacy batch files into module-scoped storage prefixes and update legacy batch file paths.';

    public function __construct(private LegacyBatchStoragePathMigrator $storagePathMigrator)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $connectionName = $this->resolveConnectionName();
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $storageDisk = $this->resolveStorageDisk($connectionName);

        if (! array_key_exists($connectionName, config('database.connections'))) {
            $this->error("The database connection [{$connectionName}] is not configured.");

            return self::FAILURE;
        }

        if (! $this->validateOperatorConnection($connectionName)) {
            return self::FAILURE;
        }

        if (app()->isProduction() && ! $dryRun && ! $force) {
            $this->error('This command moves legacy batch files in production. Re-run it with --force after reviewing the dry-run output.');

            return self::FAILURE;
        }

        try {
            $module = $this->resolveModule();
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $batchUuid = trim((string) $this->option('batch')) ?: null;

        $this->writeExecutionScope($connectionName, $module, $batchUuid, $storageDisk);

        $result = $this->migrateSafely(
            connectionName: $connectionName,
            module: $module,
            batchUuid: $batchUuid,
            dryRun: true,
            storageDisk: $storageDisk,
        );

        if ($result === null) {
            return self::FAILURE;
        }

        $this->writeSummary($result);

        if ($result['failed_paths'] !== []) {
            $this->error('Some database paths do not exist in either the legacy or module-scoped storage location. No data was changed.');
            $this->writeFailedPaths($result['failed_paths']);

            return self::FAILURE;
        }

        if ($dryRun) {
            $this->warn('Dry run only. No storage objects or database rows were changed.');

            return self::SUCCESS;
        }

        if ($result['pending_file_count'] === 0) {
            $this->info('No legacy batch storage paths need migration.');

            return self::SUCCESS;
        }

        if (! $force && ! $this->confirm('Move legacy batch storage objects and update database paths?')) {
            $this->warn('Operation cancelled. No data was changed.');

            return self::FAILURE;
        }

        $result = $this->migrateSafely(
            connectionName: $connectionName,
            module: $module,
            batchUuid: $batchUuid,
            dryRun: false,
            storageDisk: $storageDisk,
        );

        if ($result === null) {
            return self::FAILURE;
        }

        $this->writeSummary($result);

        if ($result['failed_paths'] !== []) {
            $this->error('Migration did not complete. Review failed paths and rerun after fixing storage.');
            $this->writeFailedPaths($result['failed_paths']);

            return self::FAILURE;
        }

        $this->info('Legacy batch storage path migration complete.');

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

    private function resolveStorageDisk(string $connectionName): string
    {
        return match ($connectionName) {
            'local' => 'local',
            'production_ops' => 's3',
            default => (string) config('filesystems.default', 'local'),
        };
    }

    private function validateOperatorConnection(string $connectionName): bool
    {
        if ($connectionName !== 'production_ops') {
            return true;
        }

        $database = (string) config('database.connections.production_ops.database', '');

        if ($database !== '' && $database !== (string) config('database.connections.mysql.database', '')) {
            return true;
        }

        $this->error('The [production_ops] connection is not configured for a separate production database.');
        $this->line('It is currently resolving to the same database as [mysql]: '.$database);
        $this->warn('Set OPS_DB_HOST, OPS_DB_DATABASE, OPS_DB_USERNAME, and OPS_DB_PASSWORD before using --connection=production_ops.');

        return false;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function migrateSafely(
        string $connectionName,
        ?LegacyBatchModule $module,
        ?string $batchUuid,
        bool $dryRun,
        string $storageDisk,
    ): ?array {
        try {
            return $this->storagePathMigrator->migrate(
                connectionName: $connectionName,
                module: $module,
                batchUuid: $batchUuid,
                dryRun: $dryRun,
                storageDisk: $storageDisk,
            );
        } catch (Throwable $exception) {
            $this->error('Unable to inspect legacy batch storage.');
            $this->line($exception->getMessage());
            $this->warn('Check that the active filesystem disk has valid configuration in this environment.');

            return null;
        }
    }

    private function resolveModule(): ?LegacyBatchModule
    {
        $module = trim((string) $this->option('module'));

        if ($module === '') {
            return null;
        }

        $resolved = LegacyBatchModule::tryFrom($module);

        if (! $resolved instanceof LegacyBatchModule) {
            throw new InvalidArgumentException('The --module option must be one of: brokerage, notarial, legal.');
        }

        return $resolved;
    }

    private function writeExecutionScope(string $connectionName, ?LegacyBatchModule $module, ?string $batchUuid, string $storageDisk): void
    {
        $this->info('Execution scope');
        $this->line('Environment: '.app()->environment());
        $this->line('Database connection: '.$connectionName);
        $this->line('Database host: '.(string) config("database.connections.{$connectionName}.host", 'unknown'));
        $this->line('Database name: '.(string) config("database.connections.{$connectionName}.database", 'unknown'));
        $this->line('Filesystem disk: '.$storageDisk);
        $this->line('Module filter: '.($module?->value ?? 'all'));
        $this->line('Batch filter: '.($batchUuid ?? 'all'));
        $this->newLine();
    }

    /**
     * @param  array<string, mixed>  $result
     */
    private function writeSummary(array $result): void
    {
        $this->info('Migration summary');
        $this->line('Scanned batches: '.$result['scanned_batch_count']);
        $this->line('Scanned files: '.$result['scanned_file_count']);
        $this->line('Already migrated files: '.$result['already_migrated_file_count']);
        $this->line('Pending file moves: '.$result['pending_file_count']);
        $this->line('Missing files: '.$result['missing_file_count']);
        $this->line('Copied files: '.$result['copied_file_count']);
        $this->line('Updated database rows: '.$result['updated_file_count']);
        $this->line('Updated batch disk rows: '.$result['updated_batch_count']);
        $this->line('Deleted legacy objects: '.$result['deleted_legacy_object_count']);
    }

    /**
     * @param  list<string>  $paths
     */
    private function writeFailedPaths(array $paths): void
    {
        foreach ($paths as $path) {
            $this->line('- '.$path);
        }
    }
}
