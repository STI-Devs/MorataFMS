<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two targeted additions to fix the archive data model:
 *
 * 1. export_date (DATE, nullable) on export_transactions
 *    — mirrors arrival_date on import_transactions.
 *    — set by ArchiveController from the form's file_date.
 *    — used by the archive listing to correctly group by year.
 *
 * 2. is_archive (BOOLEAN, default false) on both tables
 *    — explicit marker: true only for records created via ArchiveController.
 *    — replaces the fragile (status=completed AND year < current) inference.
 *    — indexed for fast WHERE is_archive = true queries.
 */
return new class extends Migration {
    public function up(): void
    {
        // ── export_transactions ────────────────────────────────────────────
        Schema::table('export_transactions', function (Blueprint $table) {
            // Historical shipment date — the actual date of the export,
            // not the upload date. Null for live (non-archive) transactions.
            $table->date('export_date')->nullable()->after('vessel');
            $table->index('export_date');

            // Explicit flag: true only for records created via archive upload.
            $table->boolean('is_archive')->default(false)->after('status');
            $table->index('is_archive');
        });

        // ── import_transactions ────────────────────────────────────────────
        Schema::table('import_transactions', function (Blueprint $table) {
            $table->boolean('is_archive')->default(false)->after('status');
            $table->index('is_archive');
        });
    }

    public function down(): void
    {
        Schema::table('export_transactions', function (Blueprint $table) {
            $table->dropIndex(['export_date']);
            $table->dropColumn('export_date');
            $table->dropIndex(['is_archive']);
            $table->dropColumn('is_archive');
        });

        Schema::table('import_transactions', function (Blueprint $table) {
            $table->dropIndex(['is_archive']);
            $table->dropColumn('is_archive');
        });
    }
};
