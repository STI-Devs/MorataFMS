<?php

namespace App\Console\Commands;

use App\Support\Operations\DatabaseBackupManager;
use Illuminate\Console\Command;
use Throwable;

class BackupDatabase extends Command
{
    protected $signature = 'ops:backup-database
                            {--connection= : Database connection name to export. Defaults to the configured backup connection.}';

    protected $description = 'Export a restorable SQL backup for a configured MySQL or MariaDB connection.';

    public function __construct(private DatabaseBackupManager $databaseBackupManager)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $selectedConnection = trim((string) $this->option('connection'));
        $connectionLabel = $selectedConnection !== ''
            ? $selectedConnection
            : (string) config('operations.database_backups.default_connection', 'production_ops');

        $this->info("Backing up database connection [{$connectionLabel}]...");

        try {
            $result = $this->databaseBackupManager->backup($selectedConnection !== '' ? $selectedConnection : null);
        } catch (Throwable $throwable) {
            $this->error($throwable->getMessage());

            return self::FAILURE;
        }

        $this->info('Database backup complete.');
        $this->line('Connection: '.$result['connection']);
        $this->line('Database: '.$result['database']);
        $this->line('Snapshot: '.$result['snapshot']);
        $this->line('Latest snapshot: '.$result['latest_snapshot']);

        return self::SUCCESS;
    }
}
