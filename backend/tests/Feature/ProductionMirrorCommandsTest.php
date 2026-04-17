<?php

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;

beforeEach(function () {
    File::ensureDirectoryExists(storage_path('framework/testing'));

    config([
        'operations.production_mirror.source.host' => 'maglev.proxy.rlwy.net',
        'operations.production_mirror.source.port' => '23832',
        'operations.production_mirror.source.database' => 'railway',
        'operations.production_mirror.source.username' => 'root',
        'operations.production_mirror.source.password' => 'secret',
        'operations.production_mirror.local.docker_service' => 'mysql',
        'operations.production_mirror.local.root_password' => 'root',
        'operations.production_mirror.local.database' => 'morata_fms_prod_mirror',
        'operations.production_mirror.snapshots.path' => storage_path('framework/testing/production-mirror'),
        'operations.production_mirror.snapshots.directory' => 'production-mirror',
    ]);

    File::deleteDirectory(storage_path('framework/testing/production-mirror'));
});

function processCommandString($process): string
{
    return is_array($process->command)
        ? implode(' ', $process->command)
        : $process->command;
}

test('sync production mirror stores a timestamped and latest snapshot', function () {
    Process::fake([
        '*' => Process::sequence()
            ->push(Process::result())
            ->push(Process::result())
            ->push(Process::result())
            ->push(Process::result(output: '-- snapshot sql --')),
    ]);

    $this->artisan('ops:sync-production-mirror')
        ->expectsOutputToContain('Production mirror refresh complete.')
        ->expectsOutputToContain('Database: morata_fms_prod_mirror')
        ->assertSuccessful();

    $snapshotDirectory = storage_path('framework/testing/production-mirror');

    expect(File::exists($snapshotDirectory.DIRECTORY_SEPARATOR.'latest.sql'))->toBeTrue();
    expect(trim(File::get($snapshotDirectory.DIRECTORY_SEPARATOR.'latest.sql')))->toBe('-- snapshot sql --');
    expect(array_map('basename', File::files($snapshotDirectory)))
        ->toContain('latest.sql');

    Process::assertRan(function ($process, $result) {
        return str_contains(processCommandString($process), 'docker compose up -d mysql');
    });

    Process::assertRan(function ($process, $result) {
        $command = processCommandString($process);

        return str_contains($command, 'mysqldump -h')
            && str_contains($command, 'maglev.proxy.rlwy.net')
            && str_contains($command, 'morata_fms_prod_mirror');
    });
});

test('restore production mirror uses the latest snapshot by default', function () {
    $snapshotDirectory = storage_path('framework/testing/production-mirror');
    File::ensureDirectoryExists($snapshotDirectory);
    File::put($snapshotDirectory.DIRECTORY_SEPARATOR.'latest.sql', 'DELETE FROM users;');

    Process::fake([
        '*' => Process::sequence()
            ->push(Process::result())
            ->push(Process::result())
            ->push(Process::result()),
    ]);

    $this->artisan('ops:restore-production-mirror')
        ->expectsOutputToContain('Production mirror restore complete.')
        ->expectsOutputToContain('Snapshot: '.$snapshotDirectory.DIRECTORY_SEPARATOR.'latest.sql')
        ->assertSuccessful();

    Process::assertRan(function ($process, $result) {
        return str_contains(processCommandString($process), 'docker compose up -d mysql');
    });

    Process::assertRan(function ($process, $result) {
        return str_contains(processCommandString($process), "mysql -uroot 'morata_fms_prod_mirror'");
    });
});

test('list production mirror snapshots shows the available files', function () {
    $snapshotDirectory = storage_path('framework/testing/production-mirror');
    File::ensureDirectoryExists($snapshotDirectory);
    File::put($snapshotDirectory.DIRECTORY_SEPARATOR.'mirror-20260413-011710.sql', '-- old --');
    File::put($snapshotDirectory.DIRECTORY_SEPARATOR.'latest.sql', '-- latest --');

    touch($snapshotDirectory.DIRECTORY_SEPARATOR.'mirror-20260413-011710.sql', strtotime('2026-04-13 01:17:10'));
    touch($snapshotDirectory.DIRECTORY_SEPARATOR.'latest.sql', strtotime('2026-04-13 01:20:00'));

    $this->artisan('ops:list-production-mirror-snapshots')
        ->expectsOutputToContain('latest.sql')
        ->expectsOutputToContain('mirror-20260413-011710.sql')
        ->assertSuccessful();
});
