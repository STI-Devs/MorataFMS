<?php

namespace App\Support\Operations;

use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use RuntimeException;

class DatabaseBackupManager
{
    /**
     * @return array{
     *     connection: string,
     *     database: string,
     *     snapshot: string,
     *     latest_snapshot: string
     * }
     */
    public function backup(?string $connectionName = null): array
    {
        $resolvedConnection = $this->resolveConnectionName($connectionName);
        $connection = $this->connectionConfig($resolvedConnection);
        $database = $this->databaseName($connection, $resolvedConnection);
        $snapshotPath = $this->snapshotFilePath($resolvedConnection);
        $latestSnapshotPath = $this->latestSnapshotFilePath($resolvedConnection);

        File::ensureDirectoryExists($this->snapshotDirectoryPath());

        $result = $this->backupWithLocalClient($connection, $resolvedConnection, $database, $snapshotPath);

        if ($result->failed() && $this->shouldTryDockerFallback($result)) {
            $result = $this->backupWithDockerCompose($connection, $resolvedConnection, $database, $snapshotPath);
        }

        if ($result->failed()) {
            File::delete($snapshotPath);

            $this->ensureSuccessful($result, "back up the database connection [{$resolvedConnection}]");
        }

        if (! File::exists($snapshotPath)) {
            throw new RuntimeException("The backup process did not create the snapshot file [{$snapshotPath}].");
        }

        File::copy($snapshotPath, $latestSnapshotPath);

        return [
            'connection' => $resolvedConnection,
            'database' => $database,
            'snapshot' => $snapshotPath,
            'latest_snapshot' => $latestSnapshotPath,
        ];
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function backupWithLocalClient(array $connection, string $connectionName, string $database, string $snapshotPath): ProcessResult
    {
        $command = $this->mysqldumpArrayCommand($connection, $connectionName, $database, $snapshotPath);

        return Process::forever()
            ->path(base_path())
            ->env([
                'MYSQL_PWD' => (string) ($connection['password'] ?? ''),
            ])
            ->run($command);
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function backupWithDockerCompose(array $connection, string $connectionName, string $database, string $snapshotPath): ProcessResult
    {
        $composeCommand = $this->composeBaseCommand();
        $dockerService = $this->dockerService();

        $upResult = Process::forever()
            ->path($this->workspaceRoot())
            ->run([
                ...$composeCommand,
                'up',
                '-d',
                $dockerService,
            ]);

        if ($upResult->failed()) {
            return $upResult;
        }

        $dumpResult = Process::forever()
            ->path($this->workspaceRoot())
            ->run([
                ...$composeCommand,
                'exec',
                '-T',
                $dockerService,
                'sh',
                '-lc',
                $this->mysqldumpShellCommand($connection, $connectionName, $database),
            ]);

        if ($dumpResult->successful()) {
            File::put($snapshotPath, $dumpResult->output());
        }

        return $dumpResult;
    }

    private function resolveConnectionName(?string $connectionName): string
    {
        $selectedConnection = trim((string) $connectionName);

        if ($selectedConnection !== '') {
            return $selectedConnection;
        }

        return trim((string) config('operations.database_backups.default_connection', 'production_ops'));
    }

    /**
     * @return array<string, mixed>
     */
    private function connectionConfig(string $connectionName): array
    {
        /** @var array<string, array<string, mixed>> $connections */
        $connections = config('database.connections', []);

        if (! array_key_exists($connectionName, $connections)) {
            throw new RuntimeException("The database connection [{$connectionName}] is not configured.");
        }

        $connection = $connections[$connectionName];
        $driver = strtolower(trim((string) ($connection['driver'] ?? '')));

        if (! in_array($driver, ['mysql', 'mariadb'], true)) {
            throw new RuntimeException("The database connection [{$connectionName}] must use MySQL or MariaDB for SQL backups.");
        }

        return $connection;
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function databaseName(array $connection, string $connectionName): string
    {
        $database = $this->requiredString($connection, 'database', $connectionName);

        if (! preg_match('/^[A-Za-z0-9_\$]+$/', $database)) {
            throw new RuntimeException("The database name [{$database}] for connection [{$connectionName}] contains unsupported characters.");
        }

        return $database;
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function requiredString(array $connection, string $key, string $connectionName): string
    {
        $value = trim((string) ($connection[$key] ?? ''));

        if ($value === '') {
            throw new RuntimeException("The database connection [{$connectionName}] is missing the required [{$key}] value.");
        }

        return $value;
    }

    /**
     * @param  array<string, mixed>  $connection
     * @return list<string>
     */
    private function mysqldumpArrayCommand(array $connection, string $connectionName, string $database, string $snapshotPath): array
    {
        $command = [
            'mysqldump',
            '--single-transaction',
            '--quick',
            '--routines',
            '--triggers',
            '--user='.$this->requiredString($connection, 'username', $connectionName),
            '--result-file='.$snapshotPath,
        ];

        foreach ($this->connectionTargetArguments($connection, $connectionName) as $argument) {
            $command[] = $argument;
        }

        $command[] = $database;

        return $command;
    }

    /**
     * @param  array<string, mixed>  $connection
     * @return list<string>
     */
    private function connectionTargetArguments(array $connection, string $connectionName): array
    {
        if (filled($connection['unix_socket'] ?? null)) {
            return ['--socket='.$connection['unix_socket']];
        }

        return [
            '--host='.$this->requiredString($connection, 'host', $connectionName),
            '--port='.$this->requiredString($connection, 'port', $connectionName),
        ];
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function mysqldumpShellCommand(array $connection, string $connectionName, string $database): string
    {
        $segments = [
            'MYSQL_PWD='.$this->shellEscape((string) ($connection['password'] ?? '')),
            'mysqldump',
            '--single-transaction',
            '--quick',
            '--routines',
            '--triggers',
            '--user='.$this->shellEscape($this->requiredString($connection, 'username', $connectionName)),
        ];

        foreach ($this->connectionTargetArguments($connection, $connectionName) as $argument) {
            $segments[] = $argument;
        }

        $segments[] = $this->shellEscape($database);

        return implode(' ', $segments);
    }

    /**
     * @return list<string>
     */
    private function composeBaseCommand(): array
    {
        $dockerComposeBinary = trim((string) config('operations.database_backups.compose_binary', ''));

        if ($dockerComposeBinary !== '') {
            return [$dockerComposeBinary];
        }

        $dockerComposeResult = Process::forever()
            ->path($this->workspaceRoot())
            ->run(['docker-compose', 'version']);

        if ($dockerComposeResult->successful()) {
            return ['docker-compose'];
        }

        return ['docker', 'compose'];
    }

    private function dockerService(): string
    {
        return trim((string) config('operations.database_backups.docker_service', 'mysql'));
    }

    private function shouldTryDockerFallback(ProcessResult $result): bool
    {
        $output = strtolower($result->errorOutput()."\n".$result->output());

        foreach ([
            'not recognized as an internal or external command',
            'command not found',
            'no such file or directory',
            'the system cannot find the file specified',
        ] as $needle) {
            if (str_contains($output, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function snapshotDirectoryPath(): string
    {
        $basePath = rtrim((string) config('operations.database_backups.path', storage_path('app/database-backups')), DIRECTORY_SEPARATOR.'/');
        $directory = trim((string) config('operations.database_backups.directory', 'database-backups'), '/');

        if ($directory === '' || basename(str_replace('\\', '/', $basePath)) === $directory) {
            return $basePath;
        }

        return $basePath.DIRECTORY_SEPARATOR.$directory;
    }

    private function snapshotFilePath(string $connectionName): string
    {
        return $this->snapshotDirectoryPath().DIRECTORY_SEPARATOR.'backup-'.$this->snapshotSlug($connectionName).'-'.$this->timestamp().'.sql';
    }

    private function latestSnapshotFilePath(string $connectionName): string
    {
        return $this->snapshotDirectoryPath().DIRECTORY_SEPARATOR.$this->snapshotSlug($connectionName).'-latest.sql';
    }

    private function snapshotSlug(string $connectionName): string
    {
        return preg_replace('/[^A-Za-z0-9_-]+/', '-', strtolower($connectionName)) ?: 'database';
    }

    private function timestamp(): string
    {
        return now()->format('Ymd-His');
    }

    private function workspaceRoot(): string
    {
        return dirname(base_path());
    }

    private function shellEscape(string $value): string
    {
        return "'".str_replace("'", "'\"'\"'", $value)."'";
    }

    private function ensureSuccessful(ProcessResult $result, string $action): void
    {
        if ($result->failed()) {
            throw new RuntimeException(
                "Unable to {$action}.\n".$result->errorOutput().$result->output()
            );
        }
    }
}
