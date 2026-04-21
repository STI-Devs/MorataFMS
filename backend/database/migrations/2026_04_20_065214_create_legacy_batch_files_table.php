<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('legacy_batch_files')) {
            Schema::create('legacy_batch_files', function (Blueprint $table) {
                $table->id();
                $table->foreignId('legacy_batch_id')->constrained()->cascadeOnDelete();
                $table->string('relative_path', 1024);
                $table->string('storage_path', 1024);
                $table->string('filename');
                $table->string('mime_type')->nullable();
                $table->unsignedBigInteger('size_bytes')->default(0);
                $table->timestamp('modified_at')->nullable();
                $table->string('status', 32)->default('pending');
                $table->timestamp('uploaded_at')->nullable();
                $table->timestamp('failed_at')->nullable();
                $table->text('failure_reason')->nullable();
                $table->timestamps();

                $table->unique(['legacy_batch_id', 'relative_path']);
                $table->index(['legacy_batch_id', 'status']);
            });

            return;
        }

        $databaseName = DB::getDatabaseName();

        $hasUniqueIndex = DB::table('information_schema.statistics')
            ->where('table_schema', $databaseName)
            ->where('table_name', 'legacy_batch_files')
            ->where('index_name', 'legacy_batch_files_legacy_batch_id_relative_path_unique')
            ->exists();

        $hasStatusIndex = DB::table('information_schema.statistics')
            ->where('table_schema', $databaseName)
            ->where('table_name', 'legacy_batch_files')
            ->where('index_name', 'legacy_batch_files_legacy_batch_id_status_index')
            ->exists();

        $hasForeignKey = DB::table('information_schema.table_constraints')
            ->where('table_schema', $databaseName)
            ->where('table_name', 'legacy_batch_files')
            ->where('constraint_name', 'legacy_batch_files_legacy_batch_id_foreign')
            ->where('constraint_type', 'FOREIGN KEY')
            ->exists();

        Schema::table('legacy_batch_files', function (Blueprint $table) use ($hasUniqueIndex, $hasStatusIndex, $hasForeignKey) {
            if (! $hasUniqueIndex) {
                $table->unique(['legacy_batch_id', 'relative_path']);
            }

            if (! $hasStatusIndex) {
                $table->index(['legacy_batch_id', 'status']);
            }

            if (! $hasForeignKey) {
                $table->foreign('legacy_batch_id')->references('id')->on('legacy_batches')->cascadeOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('legacy_batch_files');
    }
};
