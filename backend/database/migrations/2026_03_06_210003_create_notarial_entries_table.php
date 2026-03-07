<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notarial_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('notarial_book_id')->constrained('notarial_books')->cascadeOnDelete();
            $table->integer('doc_number'); // manual entry, 1–525
            $table->string('document_type', 50); // affidavit, power_of_attorney, real_estate, business_doc, position_paper, other
            $table->string('document_type_other', 255)->nullable(); // free text when type = 'other'
            $table->string('title', 500);
            $table->foreignId('client_id')->constrained('clients')->restrictOnDelete();
            $table->text('signer_names');
            $table->string('id_type', 100); // e.g. "Driver's License", "Passport"
            $table->string('id_number', 100);
            $table->decimal('notary_fee', 10, 2)->default(0);
            $table->timestamp('notarized_at');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            // Each doc number is unique within a book
            $table->unique(['notarial_book_id', 'doc_number']);
            $table->index('document_type');
            $table->index('notarized_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notarial_entries');
    }
};
