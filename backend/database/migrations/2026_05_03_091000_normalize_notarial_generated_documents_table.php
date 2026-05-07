<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
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

        $this->dropForeignKeysForColumn('notarial_generated_documents', 'notarial_book_id');

        if (Schema::hasColumn('notarial_generated_documents', 'notarial_book_id')) {
            Schema::table('notarial_generated_documents', function (Blueprint $table): void {
                $table->dropColumn('notarial_book_id');
            });
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

    private function dropForeignKeysForColumn(string $tableName, string $columnName): void
    {
        foreach ($this->foreignKeyNamesForColumn($tableName, $columnName) as $foreignKeyName) {
            Schema::table($tableName, function (Blueprint $table) use ($foreignKeyName): void {
                $table->dropForeign($foreignKeyName);
            });
        }
    }

    /**
     * @return list<string>
     */
    private function foreignKeyNamesForColumn(string $tableName, string $columnName): array
    {
        if (DB::getDriverName() !== 'mysql') {
            return [];
        }

        return array_values(array_map(
            static fn (object $row): string => (string) $row->constraint_name,
            DB::select(
                <<<'SQL'
                select constraint_name
                from information_schema.key_column_usage
                where table_schema = database()
                  and table_name = ?
                  and column_name = ?
                  and referenced_table_name is not null
                SQL,
                [$tableName, $columnName],
            ),
        ));
    }
};
