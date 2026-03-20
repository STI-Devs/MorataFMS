<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')->update([
            'role' => DB::raw("CASE
                WHEN role IN ('admin', 'lawyer', 'supervisor', 'manager') THEN 'admin'
                WHEN role IN ('paralegal', 'broker') THEN 'paralegal'
                ELSE 'encoder'
            END"),
        ]);

        DB::table('users')
            ->where('role', 'admin')
            ->update(['departments' => json_encode(['brokerage', 'legal'])]);

        DB::table('users')
            ->where('role', 'paralegal')
            ->update(['departments' => json_encode(['legal'])]);

        DB::table('users')
            ->where('role', 'encoder')
            ->update(['departments' => json_encode(['brokerage'])]);
    }

    public function down(): void
    {
        DB::table('users')->update([
            'role' => DB::raw("CASE
                WHEN role = 'admin' THEN 'admin'
                WHEN role = 'paralegal' THEN 'broker'
                ELSE 'encoder'
            END"),
        ]);

        DB::table('users')
            ->where('role', 'admin')
            ->update(['departments' => json_encode(['brokerage', 'legal'])]);

        DB::table('users')
            ->where('role', 'broker')
            ->update(['departments' => json_encode(['legal'])]);

        DB::table('users')
            ->where('role', 'encoder')
            ->update(['departments' => json_encode(['brokerage'])]);
    }
};
