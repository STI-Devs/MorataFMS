<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('import_transactions', function (Blueprint $table): void {
            $table->timestamp('archived_at')->nullable()->after('is_archive');
            $table->foreignId('archived_by')->nullable()->after('archived_at')->constrained('users')->nullOnDelete();
            $table->string('archive_origin', 40)->nullable()->after('archived_by');
        });

        Schema::table('export_transactions', function (Blueprint $table): void {
            $table->timestamp('archived_at')->nullable()->after('is_archive');
            $table->foreignId('archived_by')->nullable()->after('archived_at')->constrained('users')->nullOnDelete();
            $table->string('archive_origin', 40)->nullable()->after('archived_by');
        });
    }

    public function down(): void
    {
        Schema::table('export_transactions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('archived_by');
            $table->dropColumn(['archived_at', 'archive_origin']);
        });

        Schema::table('import_transactions', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('archived_by');
            $table->dropColumn(['archived_at', 'archive_origin']);
        });
    }
};
