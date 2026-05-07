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
        if (Schema::hasTable('notarial_generated_documents')) {
            return;
        }

        if (Schema::hasTable('notarial_template_records')) {
            Schema::rename('notarial_template_records', 'notarial_generated_documents');

            return;
        }

        Schema::create('notarial_generated_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notarial_template_id')->constrained()->cascadeOnDelete();
            $table->string('template_code');
            $table->string('template_label');
            $table->string('document_code');
            $table->string('document_category');
            $table->string('notarial_act_type');
            $table->string('party_name');
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
        Schema::dropIfExists('notarial_generated_documents');
    }
};
