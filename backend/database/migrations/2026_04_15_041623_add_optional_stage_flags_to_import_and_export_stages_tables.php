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
            $table->boolean('ppa_not_applicable')->default(false);
            $table->boolean('port_charges_not_applicable')->default(false);
        });

        Schema::table('export_stages', function (Blueprint $table) {
            $table->boolean('phytosanitary_not_applicable')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('export_stages', function (Blueprint $table) {
            $table->dropColumn(['phytosanitary_not_applicable']);
        });

        Schema::table('import_stages', function (Blueprint $table) {
            $table->dropColumn(['ppa_not_applicable', 'port_charges_not_applicable']);
        });
    }
};
