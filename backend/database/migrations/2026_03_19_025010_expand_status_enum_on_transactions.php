<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Convert the status column from ENUM to VARCHAR so we can store
 * human-readable labels ('Vessel Arrived', 'In Transit', etc.) that
 * match the frontend display exactly, and never need schema changes
 * to add new statuses in the future.
 */
return new class extends Migration {
    public function up(): void
    {
        // Step 1: Change to VARCHAR (preserves all existing data)
        DB::statement("ALTER TABLE import_transactions
            MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Pending'");

        DB::statement("ALTER TABLE export_transactions
            MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Pending'");

        // Step 2: Migrate old snake_case values → rich labels
        DB::statement("UPDATE import_transactions SET status = 'Pending'       WHERE status = 'pending'");
        DB::statement("UPDATE import_transactions SET status = 'Processing'    WHERE status = 'in_progress'");
        DB::statement("UPDATE import_transactions SET status = 'Completed'     WHERE status = 'completed'");
        DB::statement("UPDATE import_transactions SET status = 'Cancelled'     WHERE status = 'cancelled'");

        DB::statement("UPDATE export_transactions SET status = 'Pending'       WHERE status = 'pending'");
        DB::statement("UPDATE export_transactions SET status = 'Processing'    WHERE status = 'in_progress'");
        DB::statement("UPDATE export_transactions SET status = 'Completed'     WHERE status = 'completed'");
        DB::statement("UPDATE export_transactions SET status = 'Cancelled'     WHERE status = 'cancelled'");
    }

    public function down(): void
    {
        // Reverse: convert back to ENUM with old values
        DB::statement("UPDATE import_transactions SET status = 'pending'     WHERE status = 'Pending'");
        DB::statement("UPDATE import_transactions SET status = 'in_progress' WHERE status IN ('Vessel Arrived','Processing')");
        DB::statement("UPDATE import_transactions SET status = 'completed'   WHERE status = 'Completed'");
        DB::statement("UPDATE import_transactions SET status = 'cancelled'   WHERE status = 'Cancelled'");

        DB::statement("UPDATE export_transactions SET status = 'pending'     WHERE status = 'Pending'");
        DB::statement("UPDATE export_transactions SET status = 'in_progress' WHERE status IN ('In Transit','Departure','Processing')");
        DB::statement("UPDATE export_transactions SET status = 'completed'   WHERE status = 'Completed'");
        DB::statement("UPDATE export_transactions SET status = 'cancelled'   WHERE status = 'Cancelled'");

        DB::statement("ALTER TABLE import_transactions
            MODIFY COLUMN status ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending'");

        DB::statement("ALTER TABLE export_transactions
            MODIFY COLUMN status ENUM('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending'");
    }
};
