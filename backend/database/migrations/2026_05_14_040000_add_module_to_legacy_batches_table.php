<?php

use App\Enums\LegacyBatchModule;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('legacy_batches') || Schema::hasColumn('legacy_batches', 'module')) {
            return;
        }

        Schema::table('legacy_batches', function (Blueprint $table): void {
            $table->string('module', 32)
                ->default(LegacyBatchModule::Brokerage->value)
                ->after('department');
            $table->index(['module', 'created_at']);
            $table->index(['module', 'year', 'department']);
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('legacy_batches') || ! Schema::hasColumn('legacy_batches', 'module')) {
            return;
        }

        Schema::table('legacy_batches', function (Blueprint $table): void {
            $table->dropIndex(['module', 'created_at']);
            $table->dropIndex(['module', 'year', 'department']);
            $table->dropColumn('module');
        });
    }
};
