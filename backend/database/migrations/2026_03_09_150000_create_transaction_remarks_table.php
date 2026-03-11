<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('transaction_remarks', function (Blueprint $table) {
            $table->id();

            // Polymorphic: ImportTransaction or ExportTransaction
            $table->string('remarkble_type');
            $table->unsignedBigInteger('remarkble_id');

            $table->foreignId('author_id')->constrained('users');
            $table->enum('severity', ['info', 'warning', 'critical'])->default('info');
            $table->text('message');

            $table->boolean('is_resolved')->default(false);
            $table->foreignId('resolved_by')->nullable()->constrained('users');
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            // Composite index for fast "open remarks" lookup
            $table->index(['remarkble_type', 'remarkble_id', 'is_resolved'], 'remarks_type_id_resolved_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_remarks');
    }
};
