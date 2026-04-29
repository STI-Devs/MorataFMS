<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('legal_archive_records', function (Blueprint $table) {
            $table->id();
            $table->string('file_category', 100);
            $table->string('file_code', 100);
            $table->string('title', 255);
            $table->string('related_name', 255);
            $table->date('document_date')->nullable();
            $table->text('notes')->nullable();
            $table->string('filename', 255)->nullable();
            $table->string('path', 1000)->nullable();
            $table->string('disk', 50)->nullable();
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index('file_category');
            $table->index('file_code');
            $table->index('related_name');
            $table->index('document_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('legal_archive_records');
    }
};
