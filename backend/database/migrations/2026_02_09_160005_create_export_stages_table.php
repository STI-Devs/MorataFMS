<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('export_stages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('export_transaction_id')->constrained()->cascadeOnDelete();

            // Docs Preparation Stage
            $table->enum('docs_prep_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('docs_prep_completed_at')->nullable();
            $table->foreignId('docs_prep_completed_by')->nullable()->constrained('users')->nullOnDelete();

            // C.O (Certificate of Origin) Stage
            $table->enum('co_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('co_completed_at')->nullable();
            $table->foreignId('co_completed_by')->nullable()->constrained('users')->nullOnDelete();

            // DCCCI stage (stored on legacy `cil_*` columns)
            $table->enum('cil_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('cil_completed_at')->nullable();
            $table->foreignId('cil_completed_by')->nullable()->constrained('users')->nullOnDelete();

            // BL (Bill of Lading) Finalization Stage
            $table->enum('bl_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('bl_completed_at')->nullable();
            $table->foreignId('bl_completed_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('export_stages');
    }
};
