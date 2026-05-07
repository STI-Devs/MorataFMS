<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tableName = $this->generatedDocumentsTable();

        if ($tableName === null) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        $columns = DB::select("SHOW COLUMNS FROM `{$tableName}` LIKE 'template_data'");

        if ($columns === []) {
            return;
        }

        DB::statement("ALTER TABLE `{$tableName}` DROP COLUMN `template_data`");
    }

    public function down(): void
    {
        $tableName = $this->generatedDocumentsTable();

        if ($tableName === null) {
            return;
        }

        if (DB::getDriverName() === 'sqlite') {
            if (Schema::hasColumn($tableName, 'template_data')) {
                return;
            }

            Schema::table($tableName, function ($table): void {
                $table->longText('template_data')->nullable(false)->after('legal_party_id');
            });

            return;
        }

        $columns = DB::select("SHOW COLUMNS FROM `{$tableName}` LIKE 'template_data'");

        if ($columns !== []) {
            return;
        }

        DB::statement("ALTER TABLE `{$tableName}` ADD COLUMN `template_data` LONGTEXT NOT NULL AFTER `legal_party_id`");
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
