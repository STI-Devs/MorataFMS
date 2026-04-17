<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class OpsEnsureAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ops:ensure-admin
                            {email : Internal admin email address}
                            {--name=Support Admin : Display name for the account}
                            {--job-title=Administrator : Job title for the account}
                            {--password= : Plain-text password to assign. When omitted, one is generated}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create or recover an active internal admin account for operational access.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        $name = trim((string) $this->option('name')) ?: 'Support Admin';
        $jobTitle = trim((string) $this->option('job-title')) ?: 'Administrator';
        $plainPassword = trim((string) $this->option('password'));
        $plainPassword = $plainPassword !== '' ? $plainPassword : Str::password(24, symbols: false);

        $wasCreated = false;

        User::withoutAuditing(function () use ($email, $name, $jobTitle, $plainPassword, &$wasCreated): void {
            $user = User::query()->firstOrNew(['email' => $email]);
            $wasCreated = ! $user->exists;

            $user->forceFill([
                'name' => $name,
                'email' => $email,
                'job_title' => $jobTitle,
                'role' => UserRole::Admin,
                'password' => $plainPassword,
                'is_active' => true,
                'email_verified_at' => $user->email_verified_at ?? now(),
                'remember_token' => Str::random(10),
            ]);

            $user->save();
        });

        $this->info($wasCreated ? 'Admin account created.' : 'Admin account updated.');
        $this->line("Email: {$email}");
        $this->line("Password: {$plainPassword}");
        $this->line('Role: admin');
        $this->line('Status: active');
        $this->warn('Store this password securely and rotate it after the first recovery login.');

        return self::SUCCESS;
    }
}
