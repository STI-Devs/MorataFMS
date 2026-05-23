<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('archive-zip-exports:prune-expired')
    ->dailyAt('02:30')
    ->withoutOverlapping();

Schedule::command('legacy-batch-zip-exports:prune-expired')
    ->dailyAt('02:45')
    ->withoutOverlapping();
