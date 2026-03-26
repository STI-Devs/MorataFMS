<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasIndex('import_transactions', 'import_transactions_customs_ref_no_index')) {
            Schema::table('import_transactions', function (Blueprint $table) {
                $table->dropIndex('import_transactions_customs_ref_no_index');
            });
        }

        if (! Schema::hasIndex('import_transactions', 'import_transactions_customs_ref_no_unique', 'unique')) {
            Schema::table('import_transactions', function (Blueprint $table) {
                $table->unique('customs_ref_no', 'import_transactions_customs_ref_no_unique');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasIndex('import_transactions', 'import_transactions_customs_ref_no_unique', 'unique')) {
            Schema::table('import_transactions', function (Blueprint $table) {
                $table->dropUnique('import_transactions_customs_ref_no_unique');
            });
        }

        if (! Schema::hasIndex('import_transactions', 'import_transactions_customs_ref_no_index')) {
            Schema::table('import_transactions', function (Blueprint $table) {
                $table->index('customs_ref_no', 'import_transactions_customs_ref_no_index');
            });
        }
    }
};
