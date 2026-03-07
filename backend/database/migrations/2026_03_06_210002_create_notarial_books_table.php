<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notarial_books', function (Blueprint $table) {
            $table->id();
            $table->integer('book_number');
            $table->smallInteger('year');
            $table->string('status', 20)->default('active'); // active, full, archived
            $table->integer('entries_count')->default(0);
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            // Each book number is unique per year
            $table->unique(['book_number', 'year']);
            $table->index('status');
            $table->index('year');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notarial_books');
    }
};
