<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('export_stages', function (Blueprint $table) {
            $table->enum('dccci_status', ['pending', 'in_progress', 'completed'])->default('pending')->after('cil_completed_by');
            $table->timestamp('dccci_completed_at')->nullable()->after('dccci_status');
            $table->foreignId('dccci_completed_by')->nullable()->after('dccci_completed_at')->constrained('users')->nullOnDelete();
            $table->boolean('dccci_not_applicable')->default(false)->after('dccci_completed_by');
        });

        DB::table('export_stages')
            ->select(['id', 'cil_status', 'cil_completed_at', 'cil_completed_by'])
            ->orderBy('id')
            ->each(function (object $stage): void {
                DB::table('export_stages')
                    ->where('id', $stage->id)
                    ->update([
                        'dccci_status' => $stage->cil_status,
                        'dccci_completed_at' => $stage->cil_completed_at,
                        'dccci_completed_by' => $stage->cil_completed_by,
                        'cil_status' => 'pending',
                        'cil_completed_at' => null,
                        'cil_completed_by' => null,
                    ]);
            });
    }

    public function down(): void
    {
        DB::table('export_stages')
            ->select(['id', 'cil_status', 'cil_completed_at', 'cil_completed_by', 'dccci_status', 'dccci_completed_at', 'dccci_completed_by'])
            ->orderBy('id')
            ->each(function (object $stage): void {
                DB::table('export_stages')
                    ->where('id', $stage->id)
                    ->update([
                        'cil_status' => $stage->cil_status === 'completed' ? $stage->cil_status : $stage->dccci_status,
                        'cil_completed_at' => $stage->cil_completed_at ?? $stage->dccci_completed_at,
                        'cil_completed_by' => $stage->cil_completed_by ?? $stage->dccci_completed_by,
                    ]);
            });

        Schema::table('export_stages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('dccci_completed_by');
            $table->dropColumn([
                'dccci_status',
                'dccci_completed_at',
                'dccci_not_applicable',
            ]);
        });
    }
};
