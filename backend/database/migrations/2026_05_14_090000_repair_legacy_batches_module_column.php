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
            $table->index(['module', 'created_at'], 'legacy_batches_module_created_at_index');
            $table->index(['module', 'year', 'department'], 'legacy_batches_module_year_department_index');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('legacy_batches') || ! Schema::hasColumn('legacy_batches', 'module')) {
            return;
        }

        Schema::table('legacy_batches', function (Blueprint $table): void {
            $table->dropIndex('legacy_batches_module_created_at_index');
            $table->dropIndex('legacy_batches_module_year_department_index');
            $table->dropColumn('module');
        });
    }
};
