<?php

namespace App\Console\Commands;

use App\Actions\Users\RestoreUser;
use App\Models\User;
use Illuminate\Console\Command;
use InvalidArgumentException;

class RestoreUserCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'users:restore
                            {--id= : Soft-deleted user id to restore}
                            {--email= : Soft-deleted user email to restore}
                            {--connection= : Database connection name for this restore run}
                            {--activate : Reactivate the user after restoring}
                            {--dry-run : Preview the restore target without changing data}
                            {--force : Required in production and skips the interactive confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Restore a soft-deleted user account for support recovery.';

    public function __construct(private RestoreUser $restoreUser)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $connectionName = $this->resolveConnectionName();

        if (! array_key_exists($connectionName, config('database.connections'))) {
            $this->error("The database connection [{$connectionName}] is not configured.");

            return self::FAILURE;
        }

        if (app()->isProduction() && ! $dryRun && ! $force) {
            $this->error('This command restores a deleted account in production. Re-run it with --force after reviewing the target user.');

            return self::FAILURE;
        }

        try {
            $user = $this->resolveUser($connectionName);
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        if ($user === null) {
            $this->error('No soft-deleted user matched the provided id or email.');

            return self::FAILURE;
        }

        $activate = (bool) $this->option('activate');

        $this->writeExecutionScope($connectionName);
        $this->newLine();
        $this->info('Restore target user');
        $this->line("ID: {$user->id}");
        $this->line("Email: {$user->email}");
        $this->line('Current status: '.($user->is_active ? 'active' : 'inactive'));
        $this->line('Restored status: '.($activate ? 'active' : ($user->is_active ? 'active' : 'inactive')));

        if ($dryRun) {
            $this->warn('Dry run only. User was not restored.');

            return self::SUCCESS;
        }

        if (! $force && ! $this->confirm("Restore deleted user [{$user->email}]?")) {
            $this->warn('Operation cancelled. User was not restored.');

            return self::FAILURE;
        }

        $restored = $this->restoreUser->handle($user, $activate);

        $this->info('User restored.');
        $this->line('Status: '.($restored->is_active ? 'active' : 'inactive'));

        if (! $restored->is_active) {
            $this->warn('The user remains inactive. Use --activate only after access should be restored.');
        }

        return self::SUCCESS;
    }

    private function writeExecutionScope(string $connectionName): void
    {
        $this->info('Execution scope');
        $this->line('Environment: '.app()->environment());
        $this->line('Database connection: '.$connectionName);
        $this->line('Database host: '.(string) config("database.connections.{$connectionName}.host", 'unknown'));
        $this->line('Database name: '.(string) config("database.connections.{$connectionName}.database", 'unknown'));
    }

    private function resolveConnectionName(): string
    {
        $selectedConnection = trim((string) $this->option('connection'));

        if ($selectedConnection !== '') {
            return $selectedConnection;
        }

        return (string) config('database.default');
    }

    private function resolveUser(string $connectionName): ?User
    {
        $id = trim((string) $this->option('id'));
        $email = strtolower(trim((string) $this->option('email')));

        if (($id === '' && $email === '') || ($id !== '' && $email !== '')) {
            throw new InvalidArgumentException('Provide exactly one restore target using --id or --email.');
        }

        if ($id !== '') {
            if (! ctype_digit($id) || (int) $id <= 0) {
                throw new InvalidArgumentException('The --id option must be a positive integer.');
            }

            return User::on($connectionName)->onlyTrashed()->whereKey((int) $id)->first();
        }

        return User::on($connectionName)->onlyTrashed()->where('email', $email)->first();
    }
}
