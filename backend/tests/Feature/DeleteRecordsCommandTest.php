<?php

use App\Enums\ImportStatus;
use App\Models\AuditLog;
use App\Models\Client;
use App\Models\Document;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    config(['filesystems.default' => 's3']);
    Storage::fake('s3');
});

test('ops delete document removes the document graph and recalculates the parent transaction', function () {
    [$transaction, $document, $remark] = seedDocumentDeletionScenario();

    $this->artisan('ops:delete', [
        'target' => 'document',
        '--id' => [$document->id],
        '--force' => true,
    ])
        ->expectsOutputToContain('Database connection: sqlite')
        ->expectsOutputToContain('Deletion complete for target [document].')
        ->assertSuccessful();

    expect(Document::query()->whereKey($document->id)->exists())->toBeFalse();
    expect(TransactionRemark::query()->whereKey($remark->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', Document::class)->where('auditable_id', $document->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', TransactionRemark::class)->where('auditable_id', $remark->id)->exists())->toBeFalse();
    Storage::disk('s3')->assertMissing($document->path);

    $transaction->refresh();

    expect($transaction->status)->toBe(ImportStatus::Pending);
});

test('ops delete transaction removes the selected transaction graph and keeps users and clients', function () {
    [$transaction, $document, $remark, $client, $user] = seedTransactionDeletionScenario();

    $this->artisan('ops:delete', [
        'target' => 'transaction',
        '--type' => 'import',
        '--id' => [$transaction->id],
        '--force' => true,
    ])
        ->expectsOutputToContain('Deletion complete for target [transaction].')
        ->assertSuccessful();

    expect(ImportTransaction::query()->whereKey($transaction->id)->exists())->toBeFalse();
    expect(Document::query()->whereKey($document->id)->exists())->toBeFalse();
    expect(TransactionRemark::query()->whereKey($remark->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', ImportTransaction::class)->where('auditable_id', $transaction->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', Document::class)->where('auditable_id', $document->id)->exists())->toBeFalse();
    expect(AuditLog::query()->where('auditable_type', TransactionRemark::class)->where('auditable_id', $remark->id)->exists())->toBeFalse();
    Storage::disk('s3')->assertMissing($document->path);

    expect(User::query()->whereKey($user->id)->exists())->toBeTrue();
    expect(Client::query()->whereKey($client->id)->exists())->toBeTrue();
});

test('ops delete transaction requires an explicit type when deleting by id', function () {
    $transaction = ImportTransaction::factory()->create();

    $this->artisan('ops:delete', [
        'target' => 'transaction',
        '--id' => [$transaction->id],
    ])
        ->expectsOutputToContain('The transaction target requires --type=import or --type=export when using --id.')
        ->assertFailed();
});

test('ops delete document requires at least one id filter', function () {
    $this->artisan('ops:delete', [
        'target' => 'document',
    ])
        ->expectsOutputToContain('The document target requires at least one --id value.')
        ->assertFailed();
});

test('ops delete rejects an unknown connection name', function () {
    $this->artisan('ops:delete', [
        'target' => 'document',
        '--id' => [1],
        '--connection' => 'missing_ops_connection',
    ])
        ->expectsOutputToContain('The database connection [missing_ops_connection] is not configured.')
        ->assertFailed();
});

/**
 * @return array{0: ImportTransaction, 1: Document, 2: TransactionRemark}
 */
function seedDocumentDeletionScenario(): array
{
    $user = User::factory()->create();
    $transaction = ImportTransaction::factory()->create([
        'assigned_user_id' => $user->id,
        'status' => ImportStatus::VesselArrived,
    ]);

    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $user->id,
        'type' => 'boc',
        'path' => 'transaction-documents/delete-document.pdf',
    ]);
    Storage::disk('s3')->put($document->path, 'delete me');

    $remark = TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $transaction->id,
        'author_id' => $user->id,
        'document_id' => $document->id,
    ]);

    AuditLog::query()->create([
        'auditable_type' => Document::class,
        'auditable_id' => $document->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['filename' => $document->filename],
        'ip_address' => '127.0.0.1',
    ]);

    AuditLog::query()->create([
        'auditable_type' => TransactionRemark::class,
        'auditable_id' => $remark->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['message' => $remark->message],
        'ip_address' => '127.0.0.1',
    ]);

    return [$transaction, $document, $remark];
}

/**
 * @return array{0: ImportTransaction, 1: Document, 2: TransactionRemark, 3: Client, 4: User}
 */
function seedTransactionDeletionScenario(): array
{
    $user = User::factory()->create();
    $client = Client::factory()->create();

    $transaction = ImportTransaction::factory()->create([
        'importer_id' => $client->id,
        'assigned_user_id' => $user->id,
        'status' => ImportStatus::Processing,
    ]);

    $document = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $transaction->id,
        'uploaded_by' => $user->id,
        'type' => 'boc',
        'path' => 'transaction-documents/delete-transaction.pdf',
    ]);
    Storage::disk('s3')->put($document->path, 'delete transaction');

    $remark = TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $transaction->id,
        'author_id' => $user->id,
        'document_id' => $document->id,
    ]);

    AuditLog::query()->create([
        'auditable_type' => ImportTransaction::class,
        'auditable_id' => $transaction->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['bl_no' => $transaction->bl_no],
        'ip_address' => '127.0.0.1',
    ]);

    AuditLog::query()->create([
        'auditable_type' => Document::class,
        'auditable_id' => $document->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['filename' => $document->filename],
        'ip_address' => '127.0.0.1',
    ]);

    AuditLog::query()->create([
        'auditable_type' => TransactionRemark::class,
        'auditable_id' => $remark->id,
        'user_id' => $user->id,
        'event' => 'created',
        'new_values' => ['message' => $remark->message],
        'ip_address' => '127.0.0.1',
    ]);

    return [$transaction, $document, $remark, $client, $user];
}
