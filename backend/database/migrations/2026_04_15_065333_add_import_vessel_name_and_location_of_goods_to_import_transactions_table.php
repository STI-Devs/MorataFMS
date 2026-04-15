<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('import_transactions', function (Blueprint $table) {
            $table->string('vessel_name', 150)->nullable()->after('bl_no');
            $table->foreignId('location_of_goods_id')
                ->nullable()
                ->after('origin_country_id')
                ->constrained('locations_of_goods')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('import_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('location_of_goods_id');
            $table->dropColumn('vessel_name');
        });
    }
};
