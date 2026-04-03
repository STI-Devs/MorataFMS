<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

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
            $this->seedUser(
                name: 'Admin User',
                email: 'admin@morata.com',
                jobTitle: 'Administrator',
                role: 'admin',
            );

            $this->seedUser(
                name: 'Lawyer Admin',
                email: 'lawyer@morata.com',
                jobTitle: 'Lawyer',
                role: 'admin',
            );

            $this->seedUser(
                name: 'Paralegal User',
                email: 'paralegal@morata.com',
                jobTitle: 'Paralegal',
                role: 'paralegal',
            );

            $this->seedUser(
                name: 'Encoder User',
                email: 'encoder@morata.com',
                jobTitle: 'Encoder',
                role: 'encoder',
            );
        });
    }

    private function seedUser(string $name, string $email, string $jobTitle, string $role): void
    {
        $user = User::firstOrNew(['email' => $email]);

        $user->forceFill([
            'name' => $name,
            'email' => $email,
            'job_title' => $jobTitle,
            'role' => $role,
            'password' => 'password',
            'email_verified_at' => now(),
            'remember_token' => Str::random(10),
            'is_active' => true,
        ]);

        $user->save();
    }
}
