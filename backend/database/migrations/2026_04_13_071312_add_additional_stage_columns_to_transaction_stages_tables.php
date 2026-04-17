<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('import_stages', function (Blueprint $table) {
            $table->enum('bonds_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('bonds_completed_at')->nullable();
            $table->foreignId('bonds_completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('bonds_not_applicable')->default(false);

            $table->enum('phytosanitary_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('phytosanitary_completed_at')->nullable();
            $table->foreignId('phytosanitary_completed_by')->nullable()->constrained('users')->nullOnDelete();
        });

        Schema::table('export_stages', function (Blueprint $table) {
            $table->boolean('co_not_applicable')->default(false);

            $table->enum('phytosanitary_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('phytosanitary_completed_at')->nullable();
            $table->foreignId('phytosanitary_completed_by')->nullable()->constrained('users')->nullOnDelete();

            $table->enum('billing_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('billing_completed_at')->nullable();
            $table->foreignId('billing_completed_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('import_stages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bonds_completed_by');
            $table->dropConstrainedForeignId('phytosanitary_completed_by');
            $table->dropColumn([
                'bonds_status',
                'bonds_completed_at',
                'bonds_not_applicable',
                'phytosanitary_status',
                'phytosanitary_completed_at',
            ]);
        });

        Schema::table('export_stages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('phytosanitary_completed_by');
            $table->dropConstrainedForeignId('billing_completed_by');
            $table->dropColumn([
                'co_not_applicable',
                'phytosanitary_status',
                'phytosanitary_completed_at',
                'billing_status',
                'billing_completed_at',
            ]);
        });
    }
};
