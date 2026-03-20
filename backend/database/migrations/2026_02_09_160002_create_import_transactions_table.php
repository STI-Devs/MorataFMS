<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_transactions', function (Blueprint $table) {
            $table->id();

            // Main tracking fields for Operations Manager dashboard
            $table->string('customs_ref_no', 50)->nullable();
            $table->string('bl_no', 50)->nullable();
            $table->enum('selective_color', ['green', 'yellow', 'red'])->nullable();
            $table->foreignId('importer_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->date('arrival_date')->nullable();

            // Assignment and status
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('Pending');
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for common queries
            $table->index('customs_ref_no');
            $table->index('bl_no');
            $table->index('arrival_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_transactions');
    }
};
