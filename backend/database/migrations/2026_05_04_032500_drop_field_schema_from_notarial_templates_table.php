<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('notarial_templates', 'field_schema')) {
            return;
        }

        Schema::table('notarial_templates', function (Blueprint $table): void {
            $table->dropColumn('field_schema');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('notarial_templates', 'field_schema')) {
            return;
        }

        Schema::table('notarial_templates', function (Blueprint $table): void {
            $table->longText('field_schema')->nullable(false)->after('description');
        });
    }
};
