<?php

namespace App\Support\Operations;

use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use RuntimeException;
use SplFileInfo;

class ProductionMirrorManager
{
    public function sync(): array
    {
        $this->ensureConfigured();
        $this->ensureLocalDatabaseContainer();

        $targetDatabase = $this->localDatabase();
        $this->recreateTargetDatabase($targetDatabase);
        $this->importProductionIntoTarget($targetDatabase);

        $snapshotContents = $this->dumpLocalDatabase($targetDatabase);
        $snapshotFilename = 'mirror-'.$this->timestamp().'.sql';
        $snapshotPath = $this->snapshotFilePath($snapshotFilename);
        $latestSnapshotPath = $this->latestSnapshotFilePath();

        File::ensureDirectoryExists($this->snapshotDirectoryPath());
        File::put($snapshotPath, $snapshotContents);
        File::put($latestSnapshotPath, $snapshotContents);

        return [
            'database' => $targetDatabase,
            'snapshot' => $snapshotPath,
            'latest_snapshot' => $latestSnapshotPath,
        ];
    }

    public function restore(?string $snapshot = null): array
    {
        $this->ensureConfigured();
        $this->ensureLocalDatabaseContainer();

        $snapshotPath = $this->resolveSnapshotPath($snapshot);

        if (! File::exists($snapshotPath)) {
            throw new RuntimeException("Snapshot file [{$snapshotPath}] does not exist.");
        }

        $targetDatabase = $this->localDatabase();
        $this->recreateTargetDatabase($targetDatabase);

        $snapshotContents = File::get($snapshotPath);

        $result = Process::forever()
            ->path($this->workspaceRoot())
            ->input($snapshotContents)
            ->run($this->dockerExecMysqlCommand(
                'MYSQL_PWD='.$this->shellEscape($this->localRootPassword()).' mysql -uroot '.$this->shellEscape($targetDatabase)
            ));

        $this->ensureSuccessful($result, 'restore the local production mirror database');

        return [
            'database' => $targetDatabase,
            'snapshot' => $snapshotPath,
        ];
    }

    public function listSnapshots(): array
    {
        $directory = $this->snapshotDirectoryPath();

        if (! File::isDirectory($directory)) {
            return [];
        }

        $latestSnapshotPath = $this->latestSnapshotFilePath();

        return collect(File::files($directory))
            ->filter(fn (SplFileInfo $file): bool => $file->getExtension() === 'sql')
            ->sortByDesc(fn (SplFileInfo $file): int => $file->getMTime())
            ->map(function (SplFileInfo $file) use ($latestSnapshotPath): array {
                $fullPath = $file->getRealPath() ?: $file->getPathname();
                $normalizedFullPath = str_replace('\\', '/', strtolower($fullPath));
                $normalizedLatestPath = str_replace('\\', '/', strtolower($latestSnapshotPath));

                return [
                    'name' => $file->getFilename(),
                    'path' => $fullPath,
                    'size' => $file->getSize(),
                    'modified_at' => date('Y-m-d H:i:s', $file->getMTime()),
                    'is_latest' => $normalizedFullPath === $normalizedLatestPath,
                ];
            })
            ->values()
            ->all();
    }

    private function ensureConfigured(): void
    {
        $source = config('operations.production_mirror.source');

        foreach (['host', 'port', 'database', 'username', 'password'] as $key) {
            if (blank($source[$key] ?? null)) {
                throw new RuntimeException("Missing production mirror source configuration value [{$key}].");
            }
        }

        $this->assertSafeIdentifier($this->localDatabase(), 'local mirror database');
        $this->assertSafeIdentifier($this->sourceDatabase(), 'production source database');
    }

    private function ensureLocalDatabaseContainer(): void
    {
        $result = Process::forever()
            ->path($this->workspaceRoot())
            ->run([
                'docker',
                'compose',
                'up',
                '-d',
                $this->dockerService(),
            ]);

        $this->ensureSuccessful($result, 'start the local MySQL container');
    }

    private function recreateTargetDatabase(string $database): void
    {
        $sql = sprintf(
            'DROP DATABASE IF EXISTS `%s`; CREATE DATABASE `%s` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
            $database,
            $database,
        );

        $result = Process::forever()
            ->path($this->workspaceRoot())
            ->run($this->dockerExecMysqlCommand(
                'MYSQL_PWD='.$this->shellEscape($this->localRootPassword()).' mysql -uroot -e '.$this->shellEscape($sql)
            ));

        $this->ensureSuccessful($result, "recreate the local mirror database [{$database}]");
    }

    private function importProductionIntoTarget(string $database): void
    {
        $script = implode("\n", [
            'set -e',
            'MYSQL_PWD='.$this->shellEscape($this->sourcePassword()).' mysqldump -h '.$this->shellEscape($this->sourceHost())
                .' -P '.$this->shellEscape($this->sourcePort())
                .' -u '.$this->shellEscape($this->sourceUsername())
                .' --single-transaction --quick --routines --triggers '.$this->shellEscape($this->sourceDatabase())
                .' | MYSQL_PWD='.$this->shellEscape($this->localRootPassword()).' mysql -uroot '.$this->shellEscape($database),
        ]);

        $result = Process::forever()
            ->path($this->workspaceRoot())
            ->run($this->dockerExecMysqlCommand($script));

        $this->ensureSuccessful($result, "import production data into [{$database}]");
    }

    private function dumpLocalDatabase(string $database): string
    {
        $result = Process::forever()
            ->path($this->workspaceRoot())
            ->run($this->dockerExecMysqlCommand(
                'MYSQL_PWD='.$this->shellEscape($this->localRootPassword())
                .' mysqldump -uroot --single-transaction --quick --routines --triggers '.$this->shellEscape($database)
            ));

        $this->ensureSuccessful($result, "dump the local mirror database [{$database}]");

        return $result->output();
    }

    private function dockerExecMysqlCommand(string $script): array
    {
        return [
            'docker',
            'compose',
            'exec',
            '-T',
            $this->dockerService(),
            'sh',
            '-lc',
            $script,
        ];
    }

    private function ensureSuccessful(ProcessResult $result, string $action): void
    {
        if ($result->failed()) {
            throw new RuntimeException(
                "Unable to {$action}.\n".$result->errorOutput().$result->output()
            );
        }
    }

    private function sourceHost(): string
    {
        return (string) config('operations.production_mirror.source.host');
    }

    private function sourcePort(): string
    {
        return (string) config('operations.production_mirror.source.port');
    }

    private function sourceDatabase(): string
    {
        return (string) config('operations.production_mirror.source.database');
    }

    private function sourceUsername(): string
    {
        return (string) config('operations.production_mirror.source.username');
    }

    private function sourcePassword(): string
    {
        return (string) config('operations.production_mirror.source.password');
    }

    private function dockerService(): string
    {
        return (string) config('operations.production_mirror.local.docker_service', 'mysql');
    }

    private function localRootPassword(): string
    {
        return (string) config('operations.production_mirror.local.root_password', 'root');
    }

    private function localDatabase(): string
    {
        return (string) config('operations.production_mirror.local.database', 'morata_fms_prod_mirror');
    }

    private function snapshotBasePath(): string
    {
        return rtrim((string) config('operations.production_mirror.snapshots.path', storage_path('app/production-mirror')), DIRECTORY_SEPARATOR.'/');
    }

    private function snapshotDirectory(): string
    {
        return trim((string) config('operations.production_mirror.snapshots.directory', 'production-mirror'), '/');
    }

    private function snapshotDirectoryPath(): string
    {
        $basePath = $this->snapshotBasePath();
        $directory = $this->snapshotDirectory();

        if ($directory === '' || basename(str_replace('\\', '/', $basePath)) === $directory) {
            return $basePath;
        }

        return $basePath.DIRECTORY_SEPARATOR.$directory;
    }

    private function latestSnapshotFilePath(): string
    {
        return $this->snapshotFilePath('latest.sql');
    }

    private function snapshotFilePath(string $filename): string
    {
        return $this->snapshotDirectoryPath().DIRECTORY_SEPARATOR.$filename;
    }

    private function resolveSnapshotPath(?string $snapshot): string
    {
        if (blank($snapshot)) {
            return $this->latestSnapshotFilePath();
        }

        $normalizedSnapshot = trim((string) $snapshot);

        if (File::isAbsolutePath($normalizedSnapshot)) {
            return $normalizedSnapshot;
        }

        return $this->snapshotFilePath(basename(str_replace('\\', '/', $normalizedSnapshot)));
    }

    private function workspaceRoot(): string
    {
        return dirname(base_path());
    }

    private function timestamp(): string
    {
        return now()->format('Ymd-His');
    }

    private function assertSafeIdentifier(string $identifier, string $label): void
    {
        if (! preg_match('/^[A-Za-z0-9_]+$/', $identifier)) {
            throw new RuntimeException("Invalid {$label} [{$identifier}].");
        }
    }

    private function shellEscape(string $value): string
    {
        return "'".str_replace("'", "'\"'\"'", $value)."'";
    }
}
