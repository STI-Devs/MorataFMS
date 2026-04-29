<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notarial_legacy_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notarial_book_id')->constrained('notarial_books')->cascadeOnDelete();
            $table->string('filename');
            $table->string('path');
            $table->string('disk', 50);
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index('notarial_book_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notarial_legacy_files');
    }
};
