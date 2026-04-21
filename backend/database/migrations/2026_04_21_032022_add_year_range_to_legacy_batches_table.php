<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('legacy_batches')) {
            return;
        }

        Schema::table('legacy_batches', function (Blueprint $table) {
            if (! Schema::hasColumn('legacy_batches', 'year_from')) {
                $table->unsignedSmallInteger('year_from')->nullable()->after('year');
            }

            if (! Schema::hasColumn('legacy_batches', 'year_to')) {
                $table->unsignedSmallInteger('year_to')->nullable()->after('year_from');
            }
        });

        DB::table('legacy_batches')
            ->select(['id', 'year', 'year_from', 'year_to'])
            ->orderBy('id')
            ->chunkById(200, function ($batches): void {
                foreach ($batches as $batch) {
                    DB::table('legacy_batches')
                        ->where('id', $batch->id)
                        ->update([
                            'year_from' => $batch->year_from ?? $batch->year,
                            'year_to' => $batch->year_to ?? $batch->year,
                        ]);
                }
            });
    }

    public function down(): void
    {
        if (! Schema::hasTable('legacy_batches')) {
            return;
        }

        Schema::table('legacy_batches', function (Blueprint $table) {
            if (Schema::hasColumn('legacy_batches', 'year_to')) {
                $table->dropColumn('year_to');
            }

            if (Schema::hasColumn('legacy_batches', 'year_from')) {
                $table->dropColumn('year_from');
            }
        });
    }
};
