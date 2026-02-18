<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('import_transactions', function (Blueprint $table) {
            // Country where the goods were shipped FROM (for BOC filing, tariff classification)
            $table->foreignId('origin_country_id')
                ->nullable()
                ->after('importer_id')
                ->constrained('countries')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('import_transactions', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Country::class, 'origin_country_id');
            $table->dropColumn('origin_country_id');
        });
    }
};
