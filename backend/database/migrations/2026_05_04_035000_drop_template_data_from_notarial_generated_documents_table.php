<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = $this->generatedDocumentsTable();

        if ($tableName === null || ! Schema::hasColumn($tableName, 'template_data')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table): void {
            $table->dropColumn('template_data');
        });
    }

    public function down(): void
    {
        $tableName = $this->generatedDocumentsTable();

        if ($tableName === null || Schema::hasColumn($tableName, 'template_data')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table): void {
            $table->longText('template_data')->nullable(false)->after('legal_party_id');
        });
    }

    private function generatedDocumentsTable(): ?string
    {
        if (Schema::hasTable('notarial_generated_documents')) {
            return 'notarial_generated_documents';
        }

        if (Schema::hasTable('notarial_template_records')) {
            return 'notarial_template_records';
        }

        return null;
    }
};
