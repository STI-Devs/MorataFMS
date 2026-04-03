<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: Convert enum to string for flexibility, map old roles to new ones
        Schema::table('users', function (Blueprint $table) {
            $table->string('role_new', 50)->default('encoder')->after('email');
            $table->json('departments')->nullable()->after('role_new');
        });

        // Step 2: Migrate existing role data
        // Old roles: encoder, broker, supervisor, manager, admin
        // Final roles: encoder, paralegal, admin
        // Mapping: broker -> paralegal, supervisor/manager -> admin
        DB::table('users')->update([
            'role_new' => DB::raw("CASE
            WHEN role = 'admin' THEN 'admin'
            WHEN role = 'manager' THEN 'admin'
            WHEN role = 'supervisor' THEN 'admin'
            WHEN role = 'broker' THEN 'paralegal'
            ELSE 'encoder'
        END"),
        ]);

        // Normalize departments to the final role model.
        DB::table('users')
            ->where('role_new', 'paralegal')
            ->update(['departments' => json_encode(['legal'])]);

        DB::table('users')
            ->where('role_new', 'admin')
            ->update(['departments' => json_encode(['brokerage', 'legal'])]);

        DB::table('users')
            ->where('role_new', 'encoder')
            ->update(['departments' => json_encode(['brokerage'])]);

        // Step 3: Drop old column, rename new one
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('role_new', 'role');
        });

        // Step 4: Add index for role lookups
        Schema::table('users', function (Blueprint $table) {
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
        });

        // Reverse: convert string back to enum
        Schema::table('users', function (Blueprint $table) {
            $table->string('role_old', 50)->default('encoder')->after('email');
        });

        DB::table('users')->update([
            'role_old' => DB::raw("CASE
            WHEN role = 'admin' THEN 'admin'
            WHEN role = 'paralegal' THEN 'broker'
            ELSE 'encoder'
        END"),
        ]);

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'departments']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('role_old', 'role');
        });

        // Re-add as enum
        // Note: This doesn't perfectly restore the enum type, but preserves data
    }
};
