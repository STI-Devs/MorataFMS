<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('import_transactions', function (Blueprint $table) {
            $table->unique('bl_no', 'import_transactions_bl_no_unique');
        });

        Schema::table('export_transactions', function (Blueprint $table) {
            $table->unique('bl_no', 'export_transactions_bl_no_unique');
        });
    }

    public function down(): void
    {
        Schema::table('import_transactions', function (Blueprint $table) {
            $table->dropUnique('import_transactions_bl_no_unique');
        });

        Schema::table('export_transactions', function (Blueprint $table) {
            $table->dropUnique('export_transactions_bl_no_unique');
        });
    }
};
