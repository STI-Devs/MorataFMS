<?php

use App\Enums\ExportStatus;
use App\Enums\ImportStatus;
use App\Models\Client;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\TransactionRemark;
use App\Models\User;
use Illuminate\Support\Carbon;

function attachReviewDocuments(ImportTransaction|ExportTransaction $transaction, array $typeKeys, User $uploadedBy): void
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

function requiredReviewTypes(string $type): array
{
    $typeKeys = $type === 'import'
        ? Document::importTypeKeys()
        : Document::exportTypeKeys();

    return array_values(array_filter($typeKeys, fn (string $typeKey) => $typeKey !== 'others'));
}

test('admin can list the paginated admin document review queue', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $encoder = User::factory()->create([
        'role' => 'encoder',
        'name' => 'Sarah Velasco',
    ]);
    $importer = Client::factory()->create(['name' => 'Global Tech Corp']);
    $finalizedAt = Carbon::parse('2026-03-20 14:30:00', 'UTC');

    $importTransaction = ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-0921',
        'bl_no' => 'BL-98210344',
        'importer_id' => $importer->id,
        'assigned_user_id' => $encoder->id,
        'status' => ImportStatus::Completed,
        'is_archive' => false,
        'updated_at' => $finalizedAt,
    ]);
    $importTransaction->stages()->update([
        'billing_completed_at' => $finalizedAt,
    ]);

    foreach (['boc', 'ppa', 'do', 'billing'] as $typeKey) {
        Document::factory()->create([
            'documentable_type' => ImportTransaction::class,
            'documentable_id' => $importTransaction->id,
            'type' => $typeKey,
            'uploaded_by' => $encoder->id,
        ]);
    }

    TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $importTransaction->id,
        'author_id' => $admin->id,
        'is_resolved' => false,
    ]);

    ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-HIDDEN-ARCHIVED',
        'status' => ImportStatus::Completed,
        'is_archive' => true,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/admin/document-review?type=import&status=completed&search=Global&per_page=1')
        ->assertOk();

    $response
        ->assertJsonPath('meta.current_page', 1)
        ->assertJsonPath('meta.last_page', 1)
        ->assertJsonPath('meta.per_page', 1)
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.id', $importTransaction->id)
        ->assertJsonPath('data.0.type', 'import')
        ->assertJsonPath('data.0.ref', 'IMP-0921')
        ->assertJsonPath('data.0.bl_number', 'BL-98210344')
        ->assertJsonPath('data.0.client', 'Global Tech Corp')
        ->assertJsonPath('data.0.assigned_user', 'Sarah Velasco')
        ->assertJsonPath('data.0.status', 'Completed')
        ->assertJsonPath('data.0.finalized_date', $finalizedAt->format(DATE_ATOM))
        ->assertJsonPath('data.0.docs_count', 4)
        ->assertJsonPath('data.0.docs_total', count(requiredReviewTypes('import')))
        ->assertJsonPath('data.0.has_exceptions', true);
});

test('admin can inspect the review detail for a finalized transaction', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
        'name' => 'Admin User',
    ]);
    $encoder = User::factory()->create([
        'role' => 'encoder',
        'name' => 'Sarah Velasco',
    ]);
    $importer = Client::factory()->create(['name' => 'Global Tech Corp']);
    $finalizedAt = Carbon::parse('2026-03-20 14:30:00', 'UTC');

    $importTransaction = ImportTransaction::factory()->create([
        'customs_ref_no' => 'IMP-0921',
        'bl_no' => 'BL-98210344',
        'importer_id' => $importer->id,
        'assigned_user_id' => $encoder->id,
        'status' => ImportStatus::Completed,
        'is_archive' => false,
        'updated_at' => $finalizedAt,
    ]);
    $importTransaction->stages()->update([
        'billing_completed_at' => $finalizedAt,
    ]);

    $bocDocument = Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $importTransaction->id,
        'type' => 'boc',
        'filename' => 'boc_declaration_ab12cd.pdf',
        'size_bytes' => 2516582,
        'uploaded_by' => $encoder->id,
        'created_at' => Carbon::parse('2026-03-18 10:00:00', 'UTC'),
    ]);
    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $importTransaction->id,
        'type' => 'others',
        'filename' => 'supporting_note.pdf',
        'uploaded_by' => $encoder->id,
        'created_at' => Carbon::parse('2026-03-19 09:00:00', 'UTC'),
    ]);

    TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $importTransaction->id,
        'author_id' => $admin->id,
        'message' => 'Missing final BL from carrier',
        'is_resolved' => false,
        'created_at' => Carbon::parse('2026-03-19 08:00:00', 'UTC'),
    ]);
    TransactionRemark::factory()->create([
        'remarkble_type' => ImportTransaction::class,
        'remarkble_id' => $importTransaction->id,
        'author_id' => $admin->id,
        'message' => 'Archived note already checked',
        'is_resolved' => true,
        'created_at' => Carbon::parse('2026-03-17 08:00:00', 'UTC'),
    ]);

    $response = $this->actingAs($admin)
        ->getJson("/api/admin/document-review/import/{$importTransaction->id}")
        ->assertOk();

    $response
        ->assertJsonPath('transaction.id', $importTransaction->id)
        ->assertJsonPath('transaction.type', 'import')
        ->assertJsonPath('transaction.ref', 'IMP-0921')
        ->assertJsonPath('transaction.bl_number', 'BL-98210344')
        ->assertJsonPath('transaction.client', 'Global Tech Corp')
        ->assertJsonPath('transaction.assigned_user', 'Sarah Velasco')
        ->assertJsonPath('transaction.status', 'Completed')
        ->assertJsonPath('transaction.finalized_date', $finalizedAt->format(DATE_ATOM))
        ->assertJsonCount(count(requiredReviewTypes('import')), 'required_documents')
        ->assertJsonPath('required_documents.0.type_key', 'boc')
        ->assertJsonPath('required_documents.0.label', 'BOC Document Processing')
        ->assertJsonPath('required_documents.0.uploaded', true)
        ->assertJsonPath('required_documents.0.file.id', $bocDocument->id)
        ->assertJsonPath('required_documents.0.file.filename', 'boc_declaration_ab12cd.pdf')
        ->assertJsonPath('required_documents.0.file.uploaded_by', 'Sarah Velasco')
        ->assertJsonPath('required_documents.1.type_key', 'ppa')
        ->assertJsonPath('required_documents.1.uploaded', false)
        ->assertJsonPath('summary.total_uploaded', 2)
        ->assertJsonPath('summary.required_completed', 1)
        ->assertJsonPath('summary.required_total', count(requiredReviewTypes('import')))
        ->assertJsonPath('summary.missing_count', count(requiredReviewTypes('import')) - 1)
        ->assertJsonPath('summary.flagged_count', 1)
        ->assertJsonPath('summary.archive_ready', false);

    expect(collect($response->json('required_documents'))->pluck('type_key')->all())
        ->not->toContain('others');

    expect(collect($response->json('remarks'))->pluck('body')->all())
        ->toContain('Missing final BL from carrier')
        ->toContain('Archived note already checked');
});

test('stats endpoint reports completed cancelled missing documents and archive ready counts', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $uploader = User::factory()->create(['role' => 'encoder']);

    $readyImport = ImportTransaction::factory()->create([
        'status' => ImportStatus::Completed,
        'is_archive' => false,
        'updated_at' => Carbon::parse('2026-03-20 09:00:00', 'UTC'),
    ]);
    $readyImport->stages()->update([
        'billing_completed_at' => Carbon::parse('2026-03-20 09:00:00', 'UTC'),
    ]);
    attachReviewDocuments($readyImport, requiredReviewTypes('import'), $uploader);

    $flaggedExport = ExportTransaction::factory()->create([
        'status' => ExportStatus::Completed,
        'is_archive' => false,
        'updated_at' => Carbon::parse('2026-03-21 09:00:00', 'UTC'),
    ]);
    $flaggedExport->stages()->update([
        'bl_completed_at' => Carbon::parse('2026-03-21 09:00:00', 'UTC'),
    ]);
    attachReviewDocuments($flaggedExport, requiredReviewTypes('export'), $uploader);
    TransactionRemark::factory()->create([
        'remarkble_type' => ExportTransaction::class,
        'remarkble_id' => $flaggedExport->id,
        'is_resolved' => false,
    ]);

    $cancelledImport = ImportTransaction::factory()->create([
        'status' => ImportStatus::Cancelled,
        'is_archive' => false,
        'updated_at' => Carbon::parse('2026-03-22 09:00:00', 'UTC'),
    ]);
    Document::factory()->create([
        'documentable_type' => ImportTransaction::class,
        'documentable_id' => $cancelledImport->id,
        'type' => 'boc',
        'uploaded_by' => $uploader->id,
    ]);

    $archivedExport = ExportTransaction::factory()->create([
        'status' => ExportStatus::Completed,
        'is_archive' => true,
    ]);
    attachReviewDocuments($archivedExport, requiredReviewTypes('export'), $uploader);

    $this->actingAs($admin)
        ->getJson('/api/admin/document-review/stats')
        ->assertOk()
        ->assertJsonPath('completed_count', 2)
        ->assertJsonPath('cancelled_count', 1)
        ->assertJsonPath('missing_docs_count', 1)
        ->assertJsonPath('archive_ready_count', 1);
});

test('admin can archive a review-ready transaction', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $uploader = User::factory()->create(['role' => 'encoder']);

    $transaction = ImportTransaction::factory()->create([
        'status' => ImportStatus::Completed,
        'is_archive' => false,
        'assigned_user_id' => $uploader->id,
    ]);

    attachReviewDocuments($transaction, requiredReviewTypes('import'), $uploader);

    $this->actingAs($admin)
        ->postJson("/api/admin/document-review/import/{$transaction->id}/archive")
        ->assertOk()
        ->assertJsonPath('message', 'Transaction archived successfully.')
        ->assertJsonPath('data.id', $transaction->id)
        ->assertJsonPath('data.type', 'import')
        ->assertJsonPath('data.is_archive', true);

    expect($transaction->fresh()?->is_archive)->toBeTrue();
});

test('admin cannot archive a transaction that is not review-ready', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $uploader = User::factory()->create(['role' => 'encoder']);

    $transaction = ExportTransaction::factory()->create([
        'status' => ExportStatus::Completed,
        'is_archive' => false,
        'assigned_user_id' => $uploader->id,
    ]);

    Document::factory()->create([
        'documentable_type' => ExportTransaction::class,
        'documentable_id' => $transaction->id,
        'type' => 'boc',
        'uploaded_by' => $uploader->id,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/admin/document-review/export/{$transaction->id}/archive")
        ->assertStatus(422)
        ->assertJsonPath('message', 'This transaction is not ready for archive.');

    expect($transaction->fresh()?->is_archive)->toBeFalse();
});

test('non admins cannot access admin document review endpoints', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);

    $this->actingAs($encoder)
        ->getJson('/api/admin/document-review')
        ->assertForbidden();
});
