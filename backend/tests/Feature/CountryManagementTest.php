<?php

use App\Models\Country;
use App\Models\User;

test('active country index stays available to authenticated users', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $visibleCountry = Country::factory()->create([
        'name' => 'Japan',
        'code' => 'JP',
        'type' => 'both',
        'is_active' => true,
    ]);
    Country::factory()->create([
        'name' => 'Retired Country',
        'code' => 'RC',
        'type' => 'both',
        'is_active' => false,
    ]);

    $this->actingAs($user)
        ->getJson('/api/countries')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $visibleCountry->id)
        ->assertJsonPath('data.0.name', 'Japan')
        ->assertJsonPath('data.0.type', 'both')
        ->assertJsonPath('data.0.is_active', true);
});

test('country index can filter export destinations', function () {
    $user = User::factory()->create(['role' => 'encoder']);
    $bothCountry = Country::factory()->create([
        'name' => 'Singapore',
        'code' => 'SG',
        'type' => 'both',
    ]);
    $exportCountry = Country::factory()->exportDestination()->create([
        'name' => 'Australia',
        'code' => 'AU',
    ]);
    Country::factory()->importOrigin()->create([
        'name' => 'Canada',
        'code' => 'CA',
    ]);

    $response = $this->actingAs($user)
        ->getJson('/api/countries?type=export_destination')
        ->assertOk();

    expect(collect($response->json('data'))->pluck('id')->all())
        ->toBe([$exportCountry->id, $bothCountry->id]);
});

test('admin can include inactive countries in the country index', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $activeCountry = Country::factory()->create([
        'name' => 'Malaysia',
        'code' => 'MY',
        'is_active' => true,
    ]);
    $inactiveCountry = Country::factory()->create([
        'name' => 'Brunei',
        'code' => 'BN',
        'is_active' => false,
    ]);

    $response = $this->actingAs($admin)
        ->getJson('/api/countries?include_inactive=1')
        ->assertOk();

    expect(collect($response->json('data'))->pluck('id')->all())
        ->toBe([$inactiveCountry->id, $activeCountry->id]);
});

test('admin can create a country', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->postJson('/api/countries', [
            'name' => 'Vietnam',
            'code' => 'vn',
            'type' => 'export_destination',
        ])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Vietnam')
        ->assertJsonPath('data.code', 'VN')
        ->assertJsonPath('data.type', 'export_destination')
        ->assertJsonPath('data.type_label', 'Export Destination')
        ->assertJsonPath('data.is_active', true);

    $this->assertDatabaseHas('countries', [
        'name' => 'Vietnam',
        'code' => 'VN',
        'type' => 'export_destination',
        'is_active' => true,
    ]);
});

test('admin can update a country', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $country = Country::factory()->create([
        'name' => 'South Korea',
        'code' => 'KR',
        'type' => 'both',
    ]);

    $this->actingAs($admin)
        ->putJson("/api/countries/{$country->id}", [
            'name' => 'Korea',
            'code' => 'kor',
            'type' => 'import_origin',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Korea')
        ->assertJsonPath('data.code', 'KOR')
        ->assertJsonPath('data.type', 'import_origin')
        ->assertJsonPath('data.type_label', 'Import Origin');

    $this->assertDatabaseHas('countries', [
        'id' => $country->id,
        'name' => 'Korea',
        'code' => 'KOR',
        'type' => 'import_origin',
    ]);
});

test('admin can toggle country activity', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $country = Country::factory()->create([
        'name' => 'Indonesia',
        'code' => 'ID',
        'is_active' => true,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/countries/{$country->id}/toggle-active")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    expect($country->fresh()?->is_active)->toBeFalse();
});

test('non admins cannot manage countries', function () {
    $encoder = User::factory()->create(['role' => 'encoder']);
    $country = Country::factory()->create();

    $this->actingAs($encoder)
        ->postJson('/api/countries', [
            'name' => 'Thailand',
            'code' => 'TH',
            'type' => 'both',
        ])
        ->assertForbidden();

    $this->actingAs($encoder)
        ->putJson("/api/countries/{$country->id}", [
            'name' => 'Thailand',
            'code' => 'TH',
            'type' => 'both',
        ])
        ->assertForbidden();

    $this->actingAs($encoder)
        ->postJson("/api/countries/{$country->id}/toggle-active")
        ->assertForbidden();
});
