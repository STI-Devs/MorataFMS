<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('clients') && ! Schema::hasTable('brokerage_clients')) {
            Schema::rename('clients', 'brokerage_clients');
        }

        if (! Schema::hasTable('brokerage_clients')) {
            return;
        }

        if ($this->indexExists('brokerage_clients', 'clients_name_type_unique')) {
            Schema::table('brokerage_clients', function (Blueprint $table): void {
                $table->dropUnique('clients_name_type_unique');
            });
        }

        if (! $this->indexExists('brokerage_clients', 'brokerage_clients_name_type_unique')) {
            Schema::table('brokerage_clients', function (Blueprint $table): void {
                $table->unique(['name', 'type'], 'brokerage_clients_name_type_unique');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('brokerage_clients')) {
            return;
        }

        if ($this->indexExists('brokerage_clients', 'brokerage_clients_name_type_unique')) {
            Schema::table('brokerage_clients', function (Blueprint $table): void {
                $table->dropUnique('brokerage_clients_name_type_unique');
            });
        }

        if (Schema::hasTable('brokerage_clients') && ! Schema::hasTable('clients')) {
            Schema::rename('brokerage_clients', 'clients');
        }

        if (Schema::hasTable('clients') && ! $this->indexExists('clients', 'clients_name_type_unique')) {
            Schema::table('clients', function (Blueprint $table): void {
                $table->unique(['name', 'type'], 'clients_name_type_unique');
            });
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            $indexes = DB::select(sprintf("PRAGMA index_list('%s')", $table));

            return collect($indexes)->contains(function (object $index) use ($indexName): bool {
                return ($index->name ?? null) === $indexName;
            });
        }

        $database = DB::getDatabaseName();

        $result = DB::table('information_schema.statistics')
            ->where('table_schema', $database)
            ->where('table_name', $table)
            ->where('index_name', $indexName)
            ->exists();

        return $result;
    }
};
