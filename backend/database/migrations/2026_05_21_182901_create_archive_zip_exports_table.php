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
        Schema::create('archive_zip_exports', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('scope', 20)->default('folder');
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month')->nullable();
            $table->string('type', 16)->nullable();
            $table->boolean('mine')->default(false);
            $table->string('status', 32)->default('pending');
            $table->string('storage_disk', 50);
            $table->string('file_path', 1024)->nullable();
            $table->string('filename');
            $table->unsignedBigInteger('file_size_bytes')->default(0);
            $table->unsignedInteger('file_count')->default(0);
            $table->unsignedInteger('bl_count')->default(0);
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['requested_by', 'created_at']);
            $table->index(['status', 'created_at']);
            $table->index(['expires_at', 'status']);
            $table->index(['scope', 'year', 'month', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('archive_zip_exports');
    }
};
