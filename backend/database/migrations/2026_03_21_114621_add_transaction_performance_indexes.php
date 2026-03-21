<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('import_transactions', function (Blueprint $table): void {
            $table->index('created_at', 'import_transactions_created_at_idx');
            $table->index(['status', 'created_at'], 'import_transactions_status_created_at_idx');
            $table->index(['selective_color', 'created_at'], 'import_transactions_selective_color_created_at_idx');
            $table->index(['is_archive', 'created_at'], 'import_transactions_is_archive_created_at_idx');
            $table->index(['is_archive', 'status', 'created_at'], 'import_transactions_archive_status_created_at_idx');
            $table->index(['importer_id', 'created_at'], 'import_transactions_importer_created_at_idx');
        });

        Schema::table('export_transactions', function (Blueprint $table): void {
            $table->index('created_at', 'export_transactions_created_at_idx');
            $table->index(['status', 'created_at'], 'export_transactions_status_created_at_idx');
            $table->index(['is_archive', 'created_at'], 'export_transactions_is_archive_created_at_idx');
            $table->index(['is_archive', 'status', 'created_at'], 'export_transactions_archive_status_created_at_idx');
            $table->index(['shipper_id', 'created_at'], 'export_transactions_shipper_created_at_idx');
        });

        Schema::table('documents', function (Blueprint $table): void {
            $table->index(['documentable_type', 'documentable_id', 'created_at'], 'documents_documentable_created_at_idx');
            $table->index(['uploaded_by', 'created_at'], 'documents_uploaded_by_created_at_idx');
        });

        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->index(['auditable_type', 'auditable_id', 'created_at'], 'audit_logs_auditable_created_at_idx');
            $table->index(['user_id', 'created_at'], 'audit_logs_user_created_at_idx');
            $table->index(['event', 'created_at'], 'audit_logs_event_created_at_idx');
        });
    }

    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table): void {
            $table->dropIndex('audit_logs_auditable_created_at_idx');
            $table->dropIndex('audit_logs_user_created_at_idx');
            $table->dropIndex('audit_logs_event_created_at_idx');
        });

        Schema::table('documents', function (Blueprint $table): void {
            $table->dropIndex('documents_documentable_created_at_idx');
            $table->dropIndex('documents_uploaded_by_created_at_idx');
        });

        Schema::table('export_transactions', function (Blueprint $table): void {
            $table->dropIndex('export_transactions_created_at_idx');
            $table->dropIndex('export_transactions_status_created_at_idx');
            $table->dropIndex('export_transactions_is_archive_created_at_idx');
            $table->dropIndex('export_transactions_archive_status_created_at_idx');
            $table->dropIndex('export_transactions_shipper_created_at_idx');
        });

        Schema::table('import_transactions', function (Blueprint $table): void {
            $table->dropIndex('import_transactions_created_at_idx');
            $table->dropIndex('import_transactions_status_created_at_idx');
            $table->dropIndex('import_transactions_selective_color_created_at_idx');
            $table->dropIndex('import_transactions_is_archive_created_at_idx');
            $table->dropIndex('import_transactions_archive_status_created_at_idx');
            $table->dropIndex('import_transactions_importer_created_at_idx');
        });
    }
};
