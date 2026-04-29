<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notarial_page_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notarial_book_id')->constrained('notarial_books')->cascadeOnDelete();
            $table->unsignedSmallInteger('page_start');
            $table->unsignedSmallInteger('page_end');
            $table->string('filename', 255);
            $table->string('path', 1000);
            $table->string('disk', 50)->default('local');
            $table->string('mime_type', 150)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['notarial_book_id', 'page_start', 'page_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notarial_page_scans');
    }
};
