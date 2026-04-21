<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('legacy_batch_files')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        $hasLegacyUniqueIndex = $this->hasIndex(
            table: 'legacy_batch_files',
            indexName: 'legacy_batch_files_legacy_batch_id_relative_path_unique',
        );
        $hasHashUniqueIndex = $this->hasIndex(
            table: 'legacy_batch_files',
            indexName: 'legacy_batch_files_legacy_batch_id_relative_path_hash_unique',
        );

        if (! Schema::hasColumn('legacy_batch_files', 'relative_path_hash')) {
            Schema::table('legacy_batch_files', function (Blueprint $table): void {
                $table->char('relative_path_hash', 64)->nullable()->after('relative_path');
            });
        }

        DB::table('legacy_batch_files')
            ->select(['id', 'relative_path'])
            ->orderBy('id')
            ->chunkById(500, function ($files): void {
                foreach ($files as $file) {
                    DB::table('legacy_batch_files')
                        ->where('id', $file->id)
                        ->update([
                            'relative_path_hash' => hash('sha256', (string) $file->relative_path),
                        ]);
                }
            });

        if ($driver === 'mysql') {
            if ($hasLegacyUniqueIndex) {
                Schema::table('legacy_batch_files', function (Blueprint $table): void {
                    $table->dropUnique('legacy_batch_files_legacy_batch_id_relative_path_unique');
                });
            }

            if (! $hasHashUniqueIndex) {
                Schema::table('legacy_batch_files', function (Blueprint $table): void {
                    $table->unique(['legacy_batch_id', 'relative_path_hash']);
                });
            }

            DB::statement('ALTER TABLE legacy_batch_files MODIFY relative_path_hash CHAR(64) NOT NULL');

            return;
        }

        if ($hasLegacyUniqueIndex) {
            Schema::table('legacy_batch_files', function (Blueprint $table): void {
                $table->dropUnique(['legacy_batch_id', 'relative_path']);
            });
        }

        if (! $hasHashUniqueIndex) {
            Schema::table('legacy_batch_files', function (Blueprint $table): void {
                $table->unique(['legacy_batch_id', 'relative_path_hash']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('legacy_batch_files') || ! Schema::hasColumn('legacy_batch_files', 'relative_path_hash')) {
            return;
        }

        $driver = Schema::getConnection()->getDriverName();
        $hasHashUniqueIndex = $this->hasIndex(
            table: 'legacy_batch_files',
            indexName: 'legacy_batch_files_legacy_batch_id_relative_path_hash_unique',
        );
        $hasLegacyUniqueIndex = $this->hasIndex(
            table: 'legacy_batch_files',
            indexName: 'legacy_batch_files_legacy_batch_id_relative_path_unique',
        );

        if ($driver === 'mysql') {
            if ($hasHashUniqueIndex) {
                Schema::table('legacy_batch_files', function (Blueprint $table): void {
                    $table->dropUnique('legacy_batch_files_legacy_batch_id_relative_path_hash_unique');
                });
            }

            if (! $hasLegacyUniqueIndex) {
                Schema::table('legacy_batch_files', function (Blueprint $table): void {
                    $table->unique(['legacy_batch_id', 'relative_path']);
                });
            }
        } else {
            if ($hasHashUniqueIndex) {
                Schema::table('legacy_batch_files', function (Blueprint $table): void {
                    $table->dropUnique(['legacy_batch_id', 'relative_path_hash']);
                });
            }

            if (! $hasLegacyUniqueIndex) {
                Schema::table('legacy_batch_files', function (Blueprint $table): void {
                    $table->unique(['legacy_batch_id', 'relative_path']);
                });
            }
        }

        Schema::table('legacy_batch_files', function (Blueprint $table): void {
            $table->dropColumn('relative_path_hash');
        });
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'mysql') {
            return DB::table('information_schema.statistics')
                ->where('table_schema', DB::getDatabaseName())
                ->where('table_name', $table)
                ->where('index_name', $indexName)
                ->exists();
        }

        if ($driver === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('{$table}')");

            return collect($indexes)
                ->contains(fn (object $index): bool => ($index->name ?? null) === $indexName);
        }

        return false;
    }
};
