<?php

use App\Models\Document;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;

// --- Authentication Guard ---

test('unauthenticated users cannot list remarks', function () {
    $transaction = ImportTransaction::factory()->create();

    $this->getJson("/api/transactions/import/{$transaction->id}/remarks")
        ->assertUnauthorized();
});

test('unauthenticated users cannot create remarks', function () {
    $transaction = ImportTransaction::factory()->create();

    $this->postJson("/api/transactions/import/{$transaction->id}/remarks", [
        'severity' => 'warning',
        'message' => 'Test remark',
    ])->assertUnauthorized();
});

test('unauthenticated users cannot resolve remarks', function () {
    $remark = TransactionRemark::factory()->create();

    $this->patchJson("/api/remarks/{$remark->id}/resolve")
        ->assertUnauthorized();
});

// --- Authorization ---

test('non-admin users cannot create remarks', function () {
    $encoder = User::factory()->create(['email' => 'encoder@morata.com', 'role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);

    $this->actingAs($encoder)
        ->postJson("/api/transactions/import/{$transaction->id}/remarks", [
            'severity' => 'warning',
            'message' => 'Encoder trying to create remark',
        ])
        ->assertForbidden();
});

test('encoder cannot view remarks on transactions not assigned to them', function () {
    $encoder = User::factory()->create(['email' => 'encoder@morata.com', 'role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $otherEncoder->id]);

    $this->actingAs($encoder)
        ->getJson("/api/transactions/import/{$transaction->id}/remarks")
        ->assertForbidden();
});

test('encoder can view remarks on their assigned transaction', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $encoder = User::factory()->create(['email' => 'encoder@morata.com', 'role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);

    // Admin creates a remark
    TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $transaction->id,
        'author_id' => $admin->id,
    ]);

    $response = $this->actingAs($encoder)
        ->getJson("/api/transactions/import/{$transaction->id}/remarks");

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

// --- Create Remark ---

test('admin can create a remark on an import transaction', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();

    $response = $this->actingAs($admin)
        ->postJson("/api/transactions/import/{$transaction->id}/remarks", [
            'severity' => 'critical',
            'message' => 'BL number is incorrect, revise the PPA documents.',
        ]);

    $response->assertCreated();

    $data = $response->json('data') ?? $response->json();
    expect($data['severity'])->toBe('critical');
    expect($data['message'])->toBe('BL number is incorrect, revise the PPA documents.');
    expect($data['is_resolved'])->toBeFalse();

    $this->assertDatabaseHas('transaction_remarks', [
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $transaction->id,
        'severity' => 'critical',
        'author_id' => $admin->id,
        'is_resolved' => false,
    ]);
});

// --- Validation ---

test('creating remark fails without required fields', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();

    $this->actingAs($admin)
        ->postJson("/api/transactions/import/{$transaction->id}/remarks", [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['severity', 'message']);
});

test('creating remark fails with invalid severity', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();

    $this->actingAs($admin)
        ->postJson("/api/transactions/import/{$transaction->id}/remarks", [
            'severity' => 'urgent',
            'message' => 'test',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['severity']);
});

test('creating remark fails with message exceeding 1000 characters', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();

    $this->actingAs($admin)
        ->postJson("/api/transactions/import/{$transaction->id}/remarks", [
            'severity' => 'info',
            'message' => str_repeat('A', 1001),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['message']);
});

test('creating remark fails when attached document belongs to another transaction', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();
    $otherTransaction = ImportTransaction::factory()->create();
    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $otherTransaction->id,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/transactions/import/{$transaction->id}/remarks", [
            'severity' => 'warning',
            'message' => 'Attached to the wrong transaction.',
            'document_id' => $document->id,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['document_id']);
});

// --- Resolve Remark ---

test('admin can resolve a remark', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();

    $remark = TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $transaction->id,
        'author_id' => $admin->id,
    ]);

    $response = $this->actingAs($admin)
        ->patchJson("/api/remarks/{$remark->id}/resolve");

    $response->assertOk()
        ->assertJsonPath('message', 'Remark resolved.');

    $remark->refresh();
    expect($remark->is_resolved)->toBeTrue();
    expect($remark->resolved_by)->toBe($admin->id);
    expect($remark->resolved_at)->not->toBeNull();
});

test('assigned encoder can resolve a remark', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $encoder = User::factory()->create(['email' => 'encoder@morata.com', 'role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $encoder->id]);

    $remark = TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $transaction->id,
        'author_id' => $admin->id,
    ]);

    $response = $this->actingAs($encoder)
        ->patchJson("/api/remarks/{$remark->id}/resolve");

    $response->assertOk();

    $remark->refresh();
    expect($remark->is_resolved)->toBeTrue();
    expect($remark->resolved_by)->toBe($encoder->id);
});

test('unrelated encoder cannot resolve a remark', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $encoder = User::factory()->create(['email' => 'encoder@morata.com', 'role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create(['assigned_user_id' => $otherEncoder->id]);

    $remark = TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $transaction->id,
        'author_id' => $admin->id,
    ]);

    $this->actingAs($encoder)
        ->patchJson("/api/remarks/{$remark->id}/resolve")
        ->assertForbidden();
});

test('resolving an already-resolved remark returns 422', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);
    $transaction = ImportTransaction::factory()->create();

    $remark = TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $transaction->id,
        'author_id' => $admin->id,
        'is_resolved' => true,
        'resolved_by' => $admin->id,
        'resolved_at' => now(),
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/remarks/{$remark->id}/resolve")
        ->assertUnprocessable();
});

// --- Invalid transaction type ---

test('creating remark with invalid transaction type returns 404', function () {
    $admin = User::factory()->create(['email' => 'admin@morata.com', 'role' => 'admin']);

    $this->actingAs($admin)
        ->postJson('/api/transactions/invalid/1/remarks', [
            'severity' => 'warning',
            'message' => 'test',
        ])
        ->assertNotFound();
});
