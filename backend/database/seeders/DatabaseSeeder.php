<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed reference data
        $this->call([
            CountrySeeder::class,
            ClientSeeder::class,
        ]);

        // Create admin user
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@morata.com',
        ]);
        $admin->role = 'admin';
        $admin->save();

        // Create test users for each role
        $manager = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@morata.com',
        ]);
        $manager->role = 'manager';
        $manager->save();

        $supervisor = User::factory()->create([
            'name' => 'Supervisor User',
            'email' => 'supervisor@morata.com',
        ]);
        $supervisor->role = 'supervisor';
        $supervisor->save();

        $broker = User::factory()->create([
            'name' => 'Broker User',
            'email' => 'broker@morata.com',
        ]);
        $broker->role = 'broker';
        $broker->save();

        $encoder = User::factory()->create([
            'name' => 'Encoder User',
            'email' => 'encoder@morata.com',
        ]);
        $encoder->role = 'encoder';
        $encoder->save();

        // Seed transactions last (requires users and clients)
        $this->call([
            TransactionSeeder::class,
        ]);
    }
}
