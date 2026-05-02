<?php

use App\Actions\Users\DeactivateUser;
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
