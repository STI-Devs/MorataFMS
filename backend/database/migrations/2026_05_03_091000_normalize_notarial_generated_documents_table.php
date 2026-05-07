<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notarial_template_records') && ! Schema::hasTable('notarial_generated_documents')) {
            Schema::rename('notarial_template_records', 'notarial_generated_documents');
        }

        if (! Schema::hasTable('notarial_generated_documents') || ! Schema::hasColumn('notarial_generated_documents', 'notarial_book_id')) {
            return;
        }

        try {
            Schema::table('notarial_generated_documents', function (Blueprint $table): void {
                $table->dropConstrainedForeignId('notarial_book_id');
            });
        } catch (Throwable) {
            if (Schema::hasColumn('notarial_generated_documents', 'notarial_book_id')) {
                Schema::table('notarial_generated_documents', function (Blueprint $table): void {
                    $table->dropColumn('notarial_book_id');
                });
            }
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('notarial_generated_documents')) {
            return;
        }

        if (! Schema::hasColumn('notarial_generated_documents', 'notarial_book_id')) {
            Schema::table('notarial_generated_documents', function (Blueprint $table): void {
                $table->foreignId('notarial_book_id')->nullable()->after('notarial_template_id')->constrained('notarial_books')->nullOnDelete();
            });
        }

        if (! Schema::hasTable('notarial_template_records')) {
            Schema::rename('notarial_generated_documents', 'notarial_template_records');
        }
    }
};
