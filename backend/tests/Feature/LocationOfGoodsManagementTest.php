<?php

use App\Models\LocationOfGoods;
use App\Models\User;

test('active location of goods index stays available to authenticated users', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $visibleLocation = LocationOfGoods::factory()->create([
        'name' => 'South Harbor Warehouse',
        'is_active' => true,
    ]);
    LocationOfGoods::factory()->create([
        'name' => 'Old Container Yard',
        'is_active' => false,
    ]);

    $this->actingAs($user)
        ->getJson('/api/locations-of-goods')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $visibleLocation->id)
        ->assertJsonPath('data.0.name', 'South Harbor Warehouse')
        ->assertJsonPath('data.0.is_active', true);
});

test('admin can include inactive locations of goods in the index', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $activeLocation = LocationOfGoods::factory()->create([
        'name' => 'Cebu Inland Depot',
        'is_active' => true,
    ]);
    $inactiveLocation = LocationOfGoods::factory()->create([
        'name' => 'Legacy Yard',
        'is_active' => false,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/locations-of-goods?include_inactive=1')
        ->assertOk();

    expect(collect($response->json('data'))->pluck('id')->all())
        ->toBe([$activeLocation->id, $inactiveLocation->id]);
});

test('admin can create a location of goods', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->postJson('/api/locations-of-goods', [
            'name' => 'MICP Container Yard',
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'MICP Container Yard')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('locations_of_goods', [
        'name' => 'MICP Container Yard',
        'is_active' => true,
    ]);
});

test('admin can update a location of goods', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $locationOfGoods = LocationOfGoods::factory()->create([
        'name' => 'South Harbor',
    ]);

    $this->actingAs($admin)
        ->putJson("/api/locations-of-goods/{$locationOfGoods->id}", [
            'name' => 'South Harbor Customs Examination Area',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'South Harbor Customs Examination Area');

    $this->assertDatabaseHas('locations_of_goods', [
        'id' => $locationOfGoods->id,
        'name' => 'South Harbor Customs Examination Area',
    ]);
});

test('admin can toggle location of goods activity', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $locationOfGoods = LocationOfGoods::factory()->create([
        'name' => 'Batangas Port',
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/locations-of-goods/{$locationOfGoods->id}/toggle-active")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    expect($locationOfGoods->fresh()?->is_active)->toBeFalse();
});

test('non admins cannot manage locations of goods', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $locationOfGoods = LocationOfGoods::factory()->create();

    $this->actingAs($encoder)
        ->postJson('/api/locations-of-goods', [
            'name' => 'Subic Bay Port',
        ])
        ->assertForbidden();

    $this->actingAs($encoder)
        ->putJson("/api/locations-of-goods/{$locationOfGoods->id}", [
            'name' => 'Subic Freeport',
        ])
        ->assertForbidden();

    $this->actingAs($encoder)
        ->postJson("/api/locations-of-goods/{$locationOfGoods->id}/toggle-active")
        ->assertForbidden();
});
