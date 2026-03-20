<?php

use App\Models\Client;
use App\Models\NotarialBook;
use App\Models\User;

test('admin can create a notarial book', function () {
    $user = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($user)
        ->postJson('/api/notarial/books', [
            'book_number' => 1,
            'year' => 2026,
        ])
        ->assertCreated()
        ->assertJsonPath('data.book_number', 1);
});

test('paralegal can create a notarial entry', function () {
    $owner = User::factory()->create([
        'role' => 'admin',
    ]);
    $paralegal = User::factory()->create([
        'role' => 'paralegal',
    ]);
    $client = Client::factory()->create();

    $book = new NotarialBook([
        'book_number' => 7,
        'year' => 2026,
    ]);
    $book->status = 'active';
    $book->entries_count = 0;
    $book->opened_at = now();
    $book->created_by = $owner->id;
    $book->save();

    $this->actingAs($paralegal)
        ->postJson("/api/notarial/books/{$book->id}/entries", [
            'doc_number' => 1,
            'document_type' => 'affidavit',
            'title' => 'Affidavit of Support',
            'client_id' => $client->id,
            'signer_names' => 'Juan Dela Cruz',
            'id_type' => 'Passport',
            'id_number' => 'P1234567',
            'notary_fee' => 1500,
            'notarized_at' => now()->toISOString(),
        ])
        ->assertCreated()
        ->assertJsonPath('data.doc_number', 1);
});

test('paralegal cannot create a notarial book', function () {
    $paralegal = User::factory()->create([
        'role' => 'paralegal',
    ]);

    $this->actingAs($paralegal)
        ->postJson('/api/notarial/books', [
            'book_number' => 2,
            'year' => 2026,
        ])
        ->assertForbidden();
});
