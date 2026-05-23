<?php

use Illuminate\Support\Facades\Artisan;

test('zip export prune commands are registered in the scheduler', function () {
    Artisan::call('schedule:list', ['--json' => true]);

    $scheduledCommands = collect(json_decode(Artisan::output(), true))
        ->mapWithKeys(fn (array $event): array => [$event['command'] => $event['expression']]);

    expect($scheduledCommands->get('php artisan archive-zip-exports:prune-expired'))->toBe('30 2 * * *');
    expect($scheduledCommands->get('php artisan legacy-batch-zip-exports:prune-expired'))->toBe('45 2 * * *');
});
