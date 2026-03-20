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

        // Create users without triggering audit logs (no authenticated user during seeding)
        User::withoutAuditing(function () {
            $admin = User::factory()->create([
                'name' => 'Admin User',
                'email' => 'admin@morata.com',
                'job_title' => 'Administrator',
                'role' => 'admin',
            ]);

            User::factory()->create([
                'name' => 'Lawyer Admin',
                'email' => 'lawyer@morata.com',
                'job_title' => 'Lawyer',
                'role' => 'admin',
            ]);

            User::factory()->create([
                'name' => 'Paralegal User',
                'email' => 'paralegal@morata.com',
                'job_title' => 'Paralegal',
                'role' => 'paralegal',
            ]);

            User::factory()->create([
                'name' => 'Encoder User',
                'email' => 'encoder@morata.com',
                'job_title' => 'Encoder',
                'role' => 'encoder',
            ]);
        });
    }
}
