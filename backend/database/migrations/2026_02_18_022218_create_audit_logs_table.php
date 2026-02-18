<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // Polymorphic: which model was affected (nullable for events like login/logout)
            $table->nullableMorphs('auditable');

            // Who performed the action
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // What happened (string to support custom events like login, logout, encoder_reassigned, etc.)
            $table->string('event');

            // Field-level change tracking
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            // Request metadata
            $table->string('ip_address', 45)->nullable();

            $table->timestamp('created_at');

            // Indexes for efficient querying
            $table->index('event');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
