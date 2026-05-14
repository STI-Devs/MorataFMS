<?php

use App\Enums\LawFirmDocumentModule;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notarial_templates') && ! Schema::hasColumn('notarial_templates', 'module')) {
            Schema::table('notarial_templates', function (Blueprint $table): void {
                $table->string('module', 32)
                    ->default(LawFirmDocumentModule::Notarial->value)
                    ->after('id');
            });
        }

        if (Schema::hasTable('notarial_templates')) {
            Schema::table('notarial_templates', function (Blueprint $table): void {
                $table->dropUnique(['code']);
                $table->unique(['module', 'code']);
                $table->index(['module', 'document_category']);
            });
        }

        if (Schema::hasTable('notarial_generated_documents') && ! Schema::hasColumn('notarial_generated_documents', 'module')) {
            Schema::table('notarial_generated_documents', function (Blueprint $table): void {
                $table->string('module', 32)
                    ->default(LawFirmDocumentModule::Notarial->value)
                    ->after('id');
                $table->index(['module', 'generated_at']);
                $table->index(['module', 'document_category']);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('notarial_generated_documents') && Schema::hasColumn('notarial_generated_documents', 'module')) {
            Schema::table('notarial_generated_documents', function (Blueprint $table): void {
                $table->dropIndex(['module', 'generated_at']);
                $table->dropIndex(['module', 'document_category']);
                $table->dropColumn('module');
            });
        }

        if (Schema::hasTable('notarial_templates') && Schema::hasColumn('notarial_templates', 'module')) {
            Schema::table('notarial_templates', function (Blueprint $table): void {
                $table->dropUnique(['module', 'code']);
                $table->dropIndex(['module', 'document_category']);
                $table->dropColumn('module');
                $table->unique('code');
            });
        }
    }
};
