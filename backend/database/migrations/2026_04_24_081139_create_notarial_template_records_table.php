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
        Schema::create('notarial_template_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notarial_template_id')->constrained()->cascadeOnDelete();
            $table->foreignId('notarial_book_id')->nullable()->constrained('notarial_books')->nullOnDelete();
            $table->string('template_code');
            $table->string('template_label');
            $table->string('document_code');
            $table->string('document_category');
            $table->string('notarial_act_type');
            $table->string('party_name');
            $table->json('template_data');
            $table->text('notes')->nullable();
            $table->string('filename');
            $table->string('path');
            $table->string('disk');
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('generated_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notarial_template_records');
    }
};
