<?php

use App\Actions\Users\DeactivateUser;
use App\Actions\Users\DeleteUser;
use App\Models\AuditLog;
use App\Models\User;
use Symfony\Component\HttpKernel\Exception\HttpException;

dataset('brokerage operational roles', [
    'processor' => ['processor', 'Processor'],
    'accounting' => ['accounting', 'Accountant'],
]);

test('creating a paralegal user returns normalized departments and permissions', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => 'Legal Staff',
            'email' => 'legal.staff@morata.com',
            'job_title' => 'Legal Assistant',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'paralegal',
        ])
        ->assertCreated();

    $response->assertJsonPath('data.role', 'paralegal');
    $response->assertJsonPath('data.job_title', 'Legal Assistant');
    $response->assertJsonPath('data.departments', ['legal']);
    $response->assertJsonPath('data.permissions.access_legal_module', true);
    $response->assertJsonPath('data.permissions.access_brokerage_module', false);
    $response->assertJsonPath('data.permissions.view_notarial_books', true);
    $response->assertJsonPath('data.permissions.manage_notarial_books', false);
    $response->assertJsonPath('data.permissions.manage_notarial_templates', true);
});

test('creating a brokerage operational user returns normalized departments and permissions', function (string $role, string $roleLabel) {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => "{$roleLabel} User",
            'email' => strtolower($role).'.user@morata.com',
            'job_title' => $roleLabel,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => $role,
        ])
        ->assertCreated();

    $response->assertJsonPath('data.role', $role);
    $response->assertJsonPath('data.role_label', $roleLabel);
    $response->assertJsonPath('data.departments', ['brokerage']);
    $response->assertJsonPath('data.permissions.access_brokerage_module', true);
    $response->assertJsonPath('data.permissions.access_legal_module', false);
    $response->assertJsonPath('data.permissions.manage_users', false);
})->with('brokerage operational roles');

test('updating a user role re-syncs departments and permission payload', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $user = User::factory()->create(['role' => 'encoder']);

    $response = $this->actingAs($admin)
        ->putJson("/api/users/{$user->id}", [
            'role' => 'admin',
            'job_title' => 'Lawyer',
        ])
        ->assertOk();

    $response->assertJsonPath('data.role', 'admin');
    $response->assertJsonPath('data.job_title', 'Lawyer');
    $response->assertJsonPath('data.departments', ['brokerage', 'legal']);
    $response->assertJsonPath('data.permissions.manage_users', true);
    $response->assertJsonPath('data.permissions.view_audit_logs', true);

    expect($user->fresh()->departments)->toBe(['brokerage', 'legal']);
    expect($user->fresh()->job_title)->toBe('Lawyer');
});

test('deactivating the last active admin is rejected by the action guard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'is_active' => true,
    ]);

    $action = app(DeactivateUser::class);

    expect(fn () => $action->handle($admin))
        ->toThrow(HttpException::class, 'Cannot deactivate the last active admin account. Assign another admin first.');
});

test('deleting a user soft deletes the account and preserves historical relations', function () {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->encoder()->create();
    $user->createToken('support-token');
    $auditLog = AuditLog::query()->create([
        'auditable_type' => User::class,
        'auditable_id' => $user->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['name' => $user->name],
        'ip_address' => '127.0.0.1',
    ]);

    $this->actingAs($admin)
        ->deleteJson("/api/users/{$user->id}")
        ->assertSuccessful()
        ->assertJsonPath('message', 'User deleted successfully.');

    $deletedUser = User::withTrashed()->findOrFail($user->id);

    expect(User::query()->whereKey($user->id)->exists())->toBeFalse();
    expect($deletedUser->trashed())->toBeTrue();
    expect($deletedUser->is_active)->toBeFalse();
    expect($deletedUser->tokens()->count())->toBe(0);

    $auditLog->refresh()->load('user');

    expect($auditLog->user?->id)->toBe($user->id);
    expect($auditLog->user?->name)->toBe($user->name);
});

test('delete endpoint still requires admin authorization and rejects self deletion', function () {
    $admin = User::factory()->admin()->create();
    $encoder = User::factory()->encoder()->create();
    $target = User::factory()->encoder()->create();

    $this->actingAs($encoder)
        ->deleteJson("/api/users/{$target->id}")
        ->assertForbidden();

    $this->actingAs($admin)
        ->deleteJson("/api/users/{$admin->id}")
        ->assertForbidden();

    expect(User::withTrashed()->findOrFail($target->id)->trashed())->toBeFalse();
    expect(User::withTrashed()->findOrFail($admin->id)->trashed())->toBeFalse();
});

test('deleting the last active admin is rejected by the action guard', function () {
    $admin = User::factory()->admin()->create([
        'is_active' => true,
    ]);

    $action = app(DeleteUser::class);

    expect(fn () => $action->handle($admin))
        ->toThrow(HttpException::class, 'Cannot delete the last active admin account. Assign another admin first.');
});

test('restore user command restores a soft-deleted user without reactivating by default', function () {
    $user = User::factory()->inactive()->create();
    $user->delete();

    $this->artisan('users:restore', [
        '--id' => $user->id,
        '--force' => true,
    ])
        ->expectsOutputToContain('User restored.')
        ->expectsOutputToContain('Status: inactive')
        ->assertSuccessful();

    $restored = User::query()->findOrFail($user->id);

    expect($restored->trashed())->toBeFalse();
    expect($restored->is_active)->toBeFalse();
});

test('restore user command dry run previews the target without restoring', function () {
    $user = User::factory()->inactive()->create([
        'email' => 'preview.restore@morata.com',
    ]);
    $user->delete();

    $this->artisan('users:restore', [
        '--email' => 'preview.restore@morata.com',
        '--connection' => 'sqlite',
        '--activate' => true,
        '--dry-run' => true,
    ])
        ->expectsOutputToContain('Execution scope')
        ->expectsOutputToContain('Environment: testing')
        ->expectsOutputToContain('Database connection: sqlite')
        ->expectsOutputToContain('Restore target user')
        ->expectsOutputToContain('Email: preview.restore@morata.com')
        ->expectsOutputToContain('Current status: inactive')
        ->expectsOutputToContain('Restored status: active')
        ->expectsOutputToContain('Dry run only. User was not restored.')
        ->assertSuccessful();

    expect(User::withTrashed()->findOrFail($user->id)->trashed())->toBeTrue();
    expect(User::withTrashed()->findOrFail($user->id)->is_active)->toBeFalse();
});

test('restore user command rejects an unknown connection name', function () {
    $this->artisan('users:restore', [
        '--email' => 'missing.connection@morata.com',
        '--connection' => 'missing_ops_connection',
        '--dry-run' => true,
    ])
        ->expectsOutputToContain('The database connection [missing_ops_connection] is not configured.')
        ->assertFailed();
});

test('restore user command requires force for production mutations', function () {
    $this->app->detectEnvironment(fn () => 'production');

    $user = User::factory()->inactive()->create([
        'email' => 'production.restore@morata.com',
    ]);
    $user->delete();

    $this->artisan('users:restore', [
        '--email' => 'production.restore@morata.com',
    ])
        ->expectsOutputToContain('This command restores a deleted account in production. Re-run it with --force after reviewing the target user.')
        ->assertFailed();

    expect(User::withTrashed()->findOrFail($user->id)->trashed())->toBeTrue();
});

test('restore user command allows production dry run without force', function () {
    $this->app->detectEnvironment(fn () => 'production');

    $user = User::factory()->inactive()->create([
        'email' => 'production.preview@morata.com',
    ]);
    $user->delete();

    $this->artisan('users:restore', [
        '--email' => 'production.preview@morata.com',
        '--dry-run' => true,
    ])
        ->expectsOutputToContain('Execution scope')
        ->expectsOutputToContain('Environment: production')
        ->expectsOutputToContain('Database connection: sqlite')
        ->expectsOutputToContain('Restore target user')
        ->expectsOutputToContain('Dry run only. User was not restored.')
        ->assertSuccessful();

    expect(User::withTrashed()->findOrFail($user->id)->trashed())->toBeTrue();
});

test('restore user command can reactivate a soft-deleted user by email', function () {
    $user = User::factory()->inactive()->create([
        'email' => 'restore.me@morata.com',
    ]);
    $user->delete();

    $this->artisan('users:restore', [
        '--email' => 'restore.me@morata.com',
        '--activate' => true,
        '--force' => true,
    ])
        ->expectsOutputToContain('User restored.')
        ->expectsOutputToContain('Status: active')
        ->assertSuccessful();

    expect(User::query()->findOrFail($user->id)->is_active)->toBeTrue();
});

test('restore user command requires one explicit target', function () {
    $this->artisan('users:restore', [
        '--force' => true,
    ])
        ->expectsOutputToContain('Provide exactly one restore target using --id or --email.')
        ->assertFailed();
});
