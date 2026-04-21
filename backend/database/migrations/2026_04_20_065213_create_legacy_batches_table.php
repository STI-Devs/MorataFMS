<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('legacy_batches')) {
            return;
        }

        Schema::create('legacy_batches', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('batch_name');
            $table->string('root_folder');
            $table->unsignedSmallInteger('year');
            $table->string('department', 60);
            $table->text('notes')->nullable();
            $table->string('status', 32)->default('draft');
            $table->unsignedInteger('expected_file_count')->default(0);
            $table->unsignedInteger('uploaded_file_count')->default(0);
            $table->unsignedInteger('failed_file_count')->default(0);
            $table->unsignedBigInteger('total_size_bytes')->default(0);
            $table->string('storage_disk', 50);
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->index(['uploaded_by', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index(['year', 'department']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legacy_batches');
    }
};
