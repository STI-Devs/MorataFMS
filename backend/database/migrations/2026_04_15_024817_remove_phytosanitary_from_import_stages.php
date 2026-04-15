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
        Schema::table('import_stages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('phytosanitary_completed_by');
            $table->dropColumn([
                'phytosanitary_status',
                'phytosanitary_completed_at',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('import_stages', function (Blueprint $table) {
            $table->enum('phytosanitary_status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->timestamp('phytosanitary_completed_at')->nullable();
            $table->foreignId('phytosanitary_completed_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }
};
