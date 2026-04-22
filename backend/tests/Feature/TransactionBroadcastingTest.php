<?php

use App\Events\TransactionChanged;
use App\Events\TransactionRemarkChanged;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use Illuminate\Broadcasting\Broadcasters\Broadcaster;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Broadcasting\ShouldRescue;
use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

function attachBroadcastReviewDocuments(ImportTransaction|ExportTransaction $transaction, array $typeKeys, User $uploadedBy): void
{
    foreach ($typeKeys as $typeKey) {
        Document::factory()->create([
            'documentable_type' => $transaction::class,
            'documentable_id' => $transaction->id,
            'type' => $typeKey,
            'uploaded_by' => $uploadedBy->id,
        ]);
    }
}

function requiredBroadcastReviewTypes(string $type): array
{
    $typeKeys = $type === 'import'
        ? Document::importTypeKeys()
        : Document::exportTypeKeys();

    return array_values(array_filter($typeKeys, fn (string $typeKey) => $typeKey !== 'others'));
}

beforeEach(function () {
    Storage::fake(config('filesystems.default', 'local'));
    config()->set('transactions.realtime_enabled', true);
});

test('cors allows the socket id header used by realtime sync requests', function () {
    expect(config('cors.allowed_headers'))->toContain('X-Socket-Id');
});

test('transaction sync events broadcast immediately after commit without a queue worker', function () {
    $channels = [];
    $payload = [
        'event_type' => 'remark_created',
        'transaction_type' => 'import',
        'transaction_id' => 1,
        'reference' => 'REF-0001',
        'status' => 'Pending',
        'is_archive' => false,
        'assigned_user_id' => 1,
        'actor_id' => 2,
        'occurred_at' => now()->toISOString(),
    ];

    expect(new TransactionChanged($channels, $payload))
        ->toBeInstanceOf(ShouldBroadcastNow::class)
        ->toBeInstanceOf(ShouldRescue::class)
        ->toBeInstanceOf(ShouldDispatchAfterCommit::class);

    expect(new TransactionRemarkChanged($channels, $payload))
        ->toBeInstanceOf(ShouldBroadcastNow::class)
        ->toBeInstanceOf(ShouldRescue::class)
        ->toBeInstanceOf(ShouldDispatchAfterCommit::class);
});

test('transaction sync broadcaster skips dispatching when realtime is disabled', function () {
    config()->set('transactions.realtime_enabled', false);

    $admin = User::factory()->create(['role' => 'admin']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create([
        'assigned_user_id' => $encoder->id,
    ]);

    Event::fake([TransactionRemarkChanged::class]);

    $this->actingAs($admin)->postJson("/api/transactions/import/{$transaction->id}/remarks", [
        'severity' => 'warning',
        'message' => 'Realtime disabled check.',
    ])->assertCreated();

    Event::assertNotDispatched(TransactionRemarkChanged::class);
});

test('registered broadcast channel callbacks authorize admins and restrict encoders to their own transaction scope', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $otherEncoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create();
    $assignedTransaction = ImportTransaction::factory()->create([
        'assigned_user_id' => $encoder->id,
    ]);
    $otherTransaction = ExportTransaction::factory()->create([
        'assigned_user_id' => $otherEncoder->id,
    ]);

    /** @var Broadcaster $broadcaster */
    $broadcaster = Broadcast::connection();
    $channels = $broadcaster->getChannels();
    $userChannel = $channels->get('transactions.user.{id}');
    $transactionChannel = $channels->get('transactions.{type}.{id}');

    expect($userChannel($admin, $admin->id))->toBeTrue();
    expect($transactionChannel($admin, 'import', $transaction->id))->toBeTrue();
    expect($userChannel($encoder, $encoder->id))->toBeTrue();
    expect($userChannel($encoder, $otherEncoder->id))->toBeFalse();
    expect($transactionChannel($encoder, 'import', $assignedTransaction->id))->toBeTrue();
    expect($transactionChannel($encoder, 'export', $otherTransaction->id))->toBeFalse();
});

test('creating and resolving a remark dispatches transaction remark broadcast events', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create([
        'assigned_user_id' => $encoder->id,
    ]);

    Event::fake([TransactionRemarkChanged::class]);

    $createResponse = $this->actingAs($admin)->postJson("/api/transactions/import/{$transaction->id}/remarks", [
        'severity' => 'warning',
        'message' => 'Missing billing attachment.',
    ])->assertCreated();

    $remarkId = $createResponse->json('data.id');

    Event::assertDispatched(TransactionRemarkChanged::class, function (TransactionRemarkChanged $event) use ($transaction, $admin) {
        return $event->broadcastWith()['event_type'] === 'remark_created'
            && $event->broadcastWith()['transaction_type'] === 'import'
            && $event->broadcastWith()['transaction_id'] === $transaction->id
            && $event->broadcastWith()['actor_id'] === $admin->id;
    });

    Event::fake([TransactionRemarkChanged::class]);

    $remark = TransactionRemark::findOrFail($remarkId);

    $this->actingAs($encoder)
        ->patchJson("/api/remarks/{$remark->id}/resolve")
        ->assertOk();

    Event::assertDispatched(TransactionRemarkChanged::class, function (TransactionRemarkChanged $event) use ($transaction, $encoder) {
        return $event->broadcastWith()['event_type'] === 'remark_resolved'
            && $event->broadcastWith()['transaction_type'] === 'import'
            && $event->broadcastWith()['transaction_id'] === $transaction->id
            && $event->broadcastWith()['actor_id'] === $encoder->id;
    });
});

test('overriding status and cancelling a transaction dispatch transaction changed broadcast events', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $importTransaction = ImportTransaction::factory()->create([
        'assigned_user_id' => $encoder->id,
        'status' => 'Pending',
    ]);
    $exportTransaction = ExportTransaction::factory()->create([
        'assigned_user_id' => $encoder->id,
        'status' => 'Processing',
    ]);

    Event::fake([TransactionChanged::class]);

    $this->actingAs($admin)
        ->patchJson("/api/transactions/import/{$importTransaction->id}/status", [
            'status' => 'Completed',
        ])
        ->assertOk();

    Event::assertDispatched(TransactionChanged::class, function (TransactionChanged $event) use ($importTransaction, $admin) {
        return $event->broadcastWith()['event_type'] === 'status_changed'
            && $event->broadcastWith()['transaction_type'] === 'import'
            && $event->broadcastWith()['transaction_id'] === $importTransaction->id
            && $event->broadcastWith()['status'] === 'Completed'
            && $event->broadcastWith()['actor_id'] === $admin->id;
    });

    Event::fake([TransactionChanged::class]);

    $this->actingAs($encoder)
        ->patchJson("/api/export-transactions/{$exportTransaction->id}/cancel", [
            'reason' => 'Cancelled by broadcast test.',
        ])
        ->assertOk();

    Event::assertDispatched(TransactionChanged::class, function (TransactionChanged $event) use ($exportTransaction, $encoder) {
        return $event->broadcastWith()['event_type'] === 'cancelled'
            && $event->broadcastWith()['transaction_type'] === 'export'
            && $event->broadcastWith()['transaction_id'] === $exportTransaction->id
            && $event->broadcastWith()['status'] === 'Cancelled'
            && $event->broadcastWith()['actor_id'] === $encoder->id;
    });
});

test('uploading and deleting a document dispatches transaction changed broadcast events', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create([
        'assigned_user_id' => $encoder->id,
    ]);

    Event::fake([TransactionChanged::class]);

    $uploadResponse = $this->actingAs($encoder)->postJson('/api/documents', [
        'file' => UploadedFile::fake()->create('boc.pdf', 100, 'application/pdf'),
        'type' => 'boc',
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
    ])->assertCreated();

    Event::assertDispatched(TransactionChanged::class, function (TransactionChanged $event) use ($transaction, $encoder) {
        return $event->broadcastWith()['event_type'] === 'document_uploaded'
            && $event->broadcastWith()['transaction_type'] === 'import'
            && $event->broadcastWith()['transaction_id'] === $transaction->id
            && $event->broadcastWith()['actor_id'] === $encoder->id;
    });

    Event::fake([TransactionChanged::class]);

    $documentId = $uploadResponse->json('data.id');

    $this->actingAs($encoder)
        ->deleteJson("/api/documents/{$documentId}")
        ->assertNoContent();

    Event::assertDispatched(TransactionChanged::class, function (TransactionChanged $event) use ($transaction, $encoder) {
        return $event->broadcastWith()['event_type'] === 'document_deleted'
            && $event->broadcastWith()['transaction_type'] === 'import'
            && $event->broadcastWith()['transaction_id'] === $transaction->id
            && $event->broadcastWith()['actor_id'] === $encoder->id;
    });
});

test('archiving a review-ready transaction dispatches a transaction changed broadcast event', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $encoder = User::factory()->create(['role' => 'encoder']);
    $transaction = ImportTransaction::factory()->create([
        'status' => 'Completed',
        'is_archive' => false,
        'assigned_user_id' => $encoder->id,
    ]);

    attachBroadcastReviewDocuments($transaction, requiredBroadcastReviewTypes('import'), $encoder);

    Event::fake([TransactionChanged::class]);

    $this->actingAs($admin)
        ->postJson("/api/admin/document-review/import/{$transaction->id}/archive")
        ->assertOk();

    Event::assertDispatched(TransactionChanged::class, function (TransactionChanged $event) use ($transaction, $admin) {
        return $event->broadcastWith()['event_type'] === 'archived'
            && $event->broadcastWith()['transaction_type'] === 'import'
            && $event->broadcastWith()['transaction_id'] === $transaction->id
            && $event->broadcastWith()['is_archive'] === true
            && $event->broadcastWith()['actor_id'] === $admin->id;
    });
});
