<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('export_transactions', function (Blueprint $table) {
            $table->id();

            // Main tracking fields for Operations Manager dashboard
            $table->foreignId('shipper_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->string('bl_no', 50)->nullable();
            $table->string('vessel', 100)->nullable();

            // Additional fields
            $table->foreignId('destination_country_id')->nullable()->constrained('countries')->nullOnDelete();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status', 30)->default('Pending');
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for common queries
            $table->index('bl_no');
            $table->index('vessel');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('export_transactions');
    }
};
