<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = $this->generatedDocumentsTable();

        if ($tableName === null || Schema::hasColumn($tableName, 'legal_party_id')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) {
            $table->foreignId('legal_party_id')->nullable()->after('party_name')->constrained('legal_parties')->nullOnDelete();
        });
    }

    public function down(): void
    {
        $tableName = $this->generatedDocumentsTable();

        if ($tableName === null || ! Schema::hasColumn($tableName, 'legal_party_id')) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) {
            $table->dropConstrainedForeignId('legal_party_id');
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
