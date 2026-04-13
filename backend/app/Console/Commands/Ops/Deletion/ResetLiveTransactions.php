<?php

namespace App\Console\Commands\Ops\Deletion;

use App\Support\Operations\Deletion\LiveTransactions\LiveTransactionResetter;
use Illuminate\Console\Command;

class ResetLiveTransactions extends Command
{
    protected $signature = 'ops:reset-live-transactions
                            {--force : Required in production and skips the interactive confirmation}
                            {--dry-run : Preview what would be deleted without changing data}
                            {--keep-files : Keep document objects on the storage disk and only delete database rows}';

    protected $description = 'Delete only live import/export transaction data while preserving users, clients, and archived records.';

    public function __construct(private LiveTransactionResetter $liveTransactionResetter)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $force = (bool) $this->option('force');
        $dryRun = (bool) $this->option('dry-run');
        $keepFiles = (bool) $this->option('keep-files');

        if (app()->isProduction() && ! $force) {
            $this->error('This command is destructive in production. Re-run it with --force after reviewing the scope.');

            return self::FAILURE;
        }

        $plan = $this->liveTransactionResetter->summarize();
        $summary = $plan->summary();

        $this->info('Live transaction reset scope');
        $this->table(
            ['Item', 'Count'],
            [
                ['Live import transactions', $summary['import_count']],
                ['Live export transactions', $summary['export_count']],
                ['Related import stages', $summary['import_stage_count']],
                ['Related export stages', $summary['export_stage_count']],
                ['Related documents', $summary['document_count']],
                ['Related remarks', $summary['remark_count']],
                ['Related audit logs', $summary['audit_log_count']],
            ],
        );
        $this->line('Storage disk: '.$summary['storage_disk']);
        $this->line('Document file handling: '.($keepFiles ? 'keep files' : 'delete files'));

        if ($summary['transaction_count'] === 0) {
            $this->info('No live transactions were found. Nothing to delete.');

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn('Dry run only. No data was deleted.');

            return self::SUCCESS;
        }

        if (! $force && ! $this->confirm('This will permanently delete live transactions and their related data. Continue?')) {
            $this->warn('Operation cancelled. No data was deleted.');

            return self::FAILURE;
        }

        $result = $this->liveTransactionResetter->reset(! $keepFiles);

        $this->info('Live transaction reset complete.');
        $this->line('Deleted live transactions: '.$result['transaction_count']);
        $this->line('Deleted related documents: '.$result['document_count']);
        $this->line('Deleted related remarks: '.$result['remark_count']);
        $this->line('Deleted related audit logs: '.$result['audit_log_count']);

        if ($result['kept_files']) {
            $this->warn('Document files were preserved on storage because --keep-files was used.');
        } else {
            $this->line('Deleted document files: '.$result['deleted_file_count']);

            if ($result['failed_file_deletions'] !== []) {
                $this->warn('Some document files could not be deleted from storage:');

                foreach ($result['failed_file_deletions'] as $path) {
                    $this->line('- '.$path);
                }
            }
        }

        return self::SUCCESS;
    }
}
