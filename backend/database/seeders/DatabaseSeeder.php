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
            ]);
            $admin->role = 'admin';
            $admin->departments = ['brokerage', 'legal'];
            $admin->save();

            $lawyer = User::factory()->create([
                'name' => 'Lawyer User',
                'email' => 'lawyer@morata.com',
            ]);
            $lawyer->role = 'lawyer';
            $lawyer->departments = ['legal'];
            $lawyer->save();

            $paralegal = User::factory()->create([
                'name' => 'Paralegal User',
                'email' => 'paralegal@morata.com',
            ]);
            $paralegal->role = 'paralegal';
            $paralegal->departments = ['legal'];
            $paralegal->save();

            $encoder = User::factory()->create([
                'name' => 'Encoder User',
                'email' => 'encoder@morata.com',
            ]);
            $encoder->role = 'encoder';
            $encoder->departments = ['brokerage'];
            $encoder->save();
        });
    }
}
