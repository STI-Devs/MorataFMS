<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE import_transactions
            MODIFY COLUMN selective_color ENUM('green', 'yellow', 'orange', 'red') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE import_transactions SET selective_color = 'yellow' WHERE selective_color = 'orange'");

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        DB::statement("ALTER TABLE import_transactions
            MODIFY COLUMN selective_color ENUM('green', 'yellow', 'red') NULL");
    }
};
