<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add a composite unique constraint on (name, type) to the clients table.
 *
 * This prevents duplicate client rows when the same company is registered
 * multiple times during archive uploads. The controller will use firstOrCreate()
 * to find the existing record instead of inserting a duplicate.
 *
 * Note: MySQL unique indexes on VARCHAR columns are case-insensitive by default
 * (with utf8mb4_unicode_ci collation), so "Maersk" and "maersk" are treated as
 * the same client — which is exactly what we want.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->unique(['name', 'type'], 'clients_name_type_unique');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropUnique('clients_name_type_unique');
        });
    }
};
