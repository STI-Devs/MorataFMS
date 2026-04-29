<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $this->addArchiveColumns();
        $this->dropRegisterCounter();
    }

    public function down(): void
    {
        $this->restoreRegisterCounter();
        $this->dropArchiveColumns();
    }

    private function addArchiveColumns(): void
    {
        $hasNotes = Schema::hasColumn('notarial_books', 'notes');
        $hasFilename = Schema::hasColumn('notarial_books', 'filename');
        $hasPath = Schema::hasColumn('notarial_books', 'path');
        $hasDisk = Schema::hasColumn('notarial_books', 'disk');
        $hasMimeType = Schema::hasColumn('notarial_books', 'mime_type');
        $hasSizeBytes = Schema::hasColumn('notarial_books', 'size_bytes');

        if ($hasNotes && $hasFilename && $hasPath && $hasDisk && $hasMimeType && $hasSizeBytes) {
            return;
        }

        Schema::table('notarial_books', function (Blueprint $table) use (
            $hasNotes,
            $hasFilename,
            $hasPath,
            $hasDisk,
            $hasMimeType,
            $hasSizeBytes,
        ): void {
            if (! $hasNotes) {
                $table->text('notes')->nullable()->after('closed_at');
            }

            if (! $hasFilename) {
                $table->string('filename')->nullable()->after('notes');
            }

            if (! $hasPath) {
                $table->string('path')->nullable()->after('filename');
            }

            if (! $hasDisk) {
                $table->string('disk', 50)->nullable()->after('path');
            }

            if (! $hasMimeType) {
                $table->string('mime_type', 150)->nullable()->after('disk');
            }

            if (! $hasSizeBytes) {
                $table->unsignedBigInteger('size_bytes')->nullable()->after('mime_type');
            }
        });
    }

    private function dropRegisterCounter(): void
    {
        if (! Schema::hasColumn('notarial_books', 'entries_count')) {
            return;
        }

        Schema::table('notarial_books', function (Blueprint $table): void {
            $table->dropColumn('entries_count');
        });
    }

    private function restoreRegisterCounter(): void
    {
        if (Schema::hasColumn('notarial_books', 'entries_count')) {
            return;
        }

        Schema::table('notarial_books', function (Blueprint $table): void {
            $table->integer('entries_count')->default(0)->after('status');
        });
    }

    private function dropArchiveColumns(): void
    {
        $columns = collect([
            'notes',
            'filename',
            'path',
            'disk',
            'mime_type',
            'size_bytes',
        ])->filter(fn (string $column): bool => Schema::hasColumn('notarial_books', $column))->all();

        if ($columns === []) {
            return;
        }

        Schema::table('notarial_books', function (Blueprint $table) use ($columns): void {
            $table->dropColumn($columns);
        });
    }
};
