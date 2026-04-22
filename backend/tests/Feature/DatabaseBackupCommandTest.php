<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

beforeEach(function () {
    File::ensureDirectoryExists(storage_path('framework/testing'));

    config([
        'database.connections.production_ops' => [
            'driver' => 'mysql',
            'host' => 'maglev.proxy.rlwy.net',
            'port' => '23832',
            'database' => 'railway',
            'username' => 'root',
            'password' => 'secret',
        ],
        'operations.database_backups.default_connection' => 'production_ops',
        'operations.database_backups.path' => storage_path('framework/testing/database-backups'),
        'operations.database_backups.directory' => 'database-backups',
        'operations.database_backups.docker_service' => 'mysql',
    ]);

    File::deleteDirectory(storage_path('framework/testing/database-backups'));
});

function databaseBackupCommandString($process): string
{
    return is_array($process->command)
        ? implode(' ', $process->command)
        : $process->command;
}

test('backup database command stores a timestamped and latest sql snapshot', function () {
    Process::fake(function ($process) {
        $commandSegments = is_array($process->command)
            ? $process->command
            : (preg_split('/\s+/', $process->command) ?: []);

        $resultFileArgument = collect($commandSegments)
            ->first(fn (string $segment): bool => str_starts_with($segment, '--result-file='));

        $resultFilePath = str((string) $resultFileArgument)->after('--result-file=')->value();

        if ($resultFilePath !== '') {
            File::ensureDirectoryExists(dirname($resultFilePath));
            File::put($resultFilePath, '-- database backup --');
        }

        return Process::result();
    });

    $this->artisan('ops:backup-database')
        ->expectsOutputToContain('Database backup complete.')
        ->expectsOutputToContain('Connection: production_ops')
        ->expectsOutputToContain('Database: railway')
        ->assertSuccessful();

    $snapshotDirectory = storage_path('framework/testing/database-backups');
    $snapshots = array_map('basename', File::files($snapshotDirectory));

    expect($snapshots)->toContain('production_ops-latest.sql');
    expect(collect($snapshots)->contains(fn (string $filename): bool => str_starts_with($filename, 'backup-production_ops-') && str_ends_with($filename, '.sql')))->toBeTrue();
    expect(trim(File::get($snapshotDirectory.DIRECTORY_SEPARATOR.'production_ops-latest.sql')))->toBe('-- database backup --');

    Process::assertRan(function ($process, $result) {
        $command = databaseBackupCommandString($process);

        return str_contains($command, 'mysqldump')
            && str_contains($command, '--host=maglev.proxy.rlwy.net')
            && str_contains($command, '--port=23832')
            && str_contains($command, '--user=root')
            && str_contains($command, '--result-file=')
            && ($process->environment['MYSQL_PWD'] ?? null) === 'secret';
    });
});

test('backup database command fails for an unknown connection', function () {
    Process::fake();

    $this->artisan('ops:backup-database', [
        '--connection' => 'missing_connection',
    ])
        ->expectsOutputToContain('The database connection [missing_connection] is not configured.')
        ->assertFailed();

    Process::assertNothingRan();
});

test('backup database command falls back to docker compose when mysqldump is unavailable', function () {
    Process::fake(function ($process) {
        $command = databaseBackupCommandString($process);

        if (str_contains($command, 'docker-compose version')) {
            return Process::result();
        }

        if (str_contains($command, 'mysqldump') && str_contains($command, '--result-file=')) {
            return Process::result(
                output: "'mysqldump' is not recognized as an internal or external command,\noperable program or batch file.\n",
                exitCode: 1,
            );
        }

        if (str_contains($command, 'docker-compose up -d mysql')) {
            return Process::result();
        }

        if (str_contains($command, 'docker-compose exec -T mysql sh -lc')) {
            return Process::result(output: '-- docker fallback backup --');
        }

        return Process::result();
    });

    $this->artisan('ops:backup-database')
        ->expectsOutputToContain('Database backup complete.')
        ->assertSuccessful();

    $snapshotDirectory = storage_path('framework/testing/database-backups');

    expect(trim(File::get($snapshotDirectory.DIRECTORY_SEPARATOR.'production_ops-latest.sql')))->toBe('-- docker fallback backup --');

    Process::assertRan(function ($process, $result) {
        return str_contains(databaseBackupCommandString($process), 'docker-compose up -d mysql');
    });

    Process::assertRan(function ($process, $result) {
        $command = databaseBackupCommandString($process);

        return str_contains($command, 'docker-compose exec -T mysql sh -lc')
            && str_contains($command, 'maglev.proxy.rlwy.net')
            && str_contains($command, '23832');
    });
});
