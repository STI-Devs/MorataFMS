<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notarial_attachments') && ! Schema::hasTable('legacy_notarial_attachments')) {
            Schema::rename('notarial_attachments', 'legacy_notarial_attachments');
        }

        if (Schema::hasTable('notarial_entries') && ! Schema::hasTable('legacy_notarial_entries')) {
            Schema::rename('notarial_entries', 'legacy_notarial_entries');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('legacy_notarial_entries') && ! Schema::hasTable('notarial_entries')) {
            Schema::rename('legacy_notarial_entries', 'notarial_entries');
        }

        if (Schema::hasTable('legacy_notarial_attachments') && ! Schema::hasTable('notarial_attachments')) {
            Schema::rename('legacy_notarial_attachments', 'notarial_attachments');
        }
    }
};
