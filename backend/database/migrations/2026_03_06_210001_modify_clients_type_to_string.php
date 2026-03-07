<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Step 1: Drop the composite unique index that includes 'type'
        Schema::table('clients', function (Blueprint $table) {
            $table->dropUnique('clients_name_type_unique');
        });

        // Step 2: Add new string column, copy data, drop old enum, rename
        Schema::table('clients', function (Blueprint $table) {
            $table->string('type_new', 50)->default('both')->after('name');
        });

        DB::table('clients')->update(['type_new' => DB::raw('type')]);

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->renameColumn('type_new', 'type');
        });

        // Step 3: Re-add the composite unique index
        Schema::table('clients', function (Blueprint $table) {
            $table->unique(['name', 'type'], 'clients_name_type_unique');
        });

        // Valid types: importer, exporter, both, notarial, all
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropUnique('clients_name_type_unique');
        });

        // Filter out new types before reverting
        DB::table('clients')
            ->whereIn('type', ['notarial', 'all'])
            ->update(['type' => 'both']);

        Schema::table('clients', function (Blueprint $table) {
            $table->string('type_old', 50)->default('both')->after('name');
        });

        DB::table('clients')->update(['type_old' => DB::raw('type')]);

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('type');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->renameColumn('type_old', 'type');
        });

        Schema::table('clients', function (Blueprint $table) {
            $table->unique(['name', 'type'], 'clients_name_type_unique');
        });
    }
};
