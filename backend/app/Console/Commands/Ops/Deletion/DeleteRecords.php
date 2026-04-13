<?php

namespace App\Console\Commands\Ops\Deletion;

use App\Support\Operations\Deletion\DeleteOperationExecutor;
use App\Support\Operations\Deletion\DeleteOperationPlanner;
use Illuminate\Console\Command;
use InvalidArgumentException;

class DeleteRecords extends Command
{
    protected $signature = 'ops:delete
                            {target : Allowed targets: document, transaction}
                            {--id=* : One or more numeric IDs for the selected target}
                            {--bl-no=* : One or more BL numbers for the transaction target}
                            {--type=any : For transaction target: import, export, or any}
                            {--dry-run : Preview what would be deleted without changing data}
                            {--force : Required in production and skips the interactive confirmation}
                            {--keep-files : Keep stored document objects and only delete database rows}';

    protected $description = 'Delete a controlled domain target and its related records using explicit filters.';

    public function __construct(
        private DeleteOperationPlanner $deleteOperationPlanner,
        private DeleteOperationExecutor $deleteOperationExecutor,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $target = strtolower(trim((string) $this->argument('target')));
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $keepFiles = (bool) $this->option('keep-files');

        if (app()->isProduction() && ! $force) {
            $this->error('This command is destructive in production. Re-run it with --force after reviewing the scope.');

            return self::FAILURE;
        }

        try {
            $plan = $this->deleteOperationPlanner->plan($target, $this->filters());
        } catch (InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        /** @var array<string, mixed> $summary */
        $summary = $plan->summary();

        $this->info("Delete scope for target [{$target}]");
        if (isset($summary['storage_disk'])) {
            $this->line('Storage disk: '.$summary['storage_disk']);
        }
        $this->line('Document file handling: '.($keepFiles ? 'keep files' : 'delete files'));
        $this->newLine();

        foreach ($summary as $key => $value) {
            if ($key === 'storage_disk') {
                continue;
            }

            $this->line(str($key)->replace('_', ' ')->title()->value().': '.$value);
        }

        $recordCount = (int) ($summary['transaction_count'] ?? $summary['document_count'] ?? 0);

        if ($recordCount === 0) {
            $this->info('No matching records were found. Nothing to delete.');

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn('Dry run only. No data was deleted.');

            return self::SUCCESS;
        }

        if (! $force && ! $this->confirm("This will permanently delete the selected [{$target}] data and related records. Continue?")) {
            $this->warn('Operation cancelled. No data was deleted.');

            return self::FAILURE;
        }

        $result = $this->deleteOperationExecutor->execute($plan, ! $keepFiles);

        $this->info("Deletion complete for target [{$result->target}].");

        foreach ($result->summary as $key => $value) {
            if ($key === 'storage_disk') {
                continue;
            }

            if (is_array($value)) {
                if ($value !== []) {
                    $this->warn(str($key)->replace('_', ' ')->title()->value().':');
                    foreach ($value as $item) {
                        $this->line('- '.$item);
                    }
                }

                continue;
            }

            $this->line(str($key)->replace('_', ' ')->title()->value().': '.$value);
        }

        return self::SUCCESS;
    }

    /**
     * @return array{
     *     id: list<int>,
     *     bl_no: list<string>,
     *     type: string
     * }
     */
    private function filters(): array
    {
        $ids = collect((array) $this->option('id'))
            ->map(fn (mixed $id): int => (int) $id)
            ->filter(fn (int $id): bool => $id > 0)
            ->unique()
            ->values()
            ->all();

        $blNumbers = collect((array) $this->option('bl-no'))
            ->map(fn (mixed $bl): string => trim((string) $bl))
            ->filter(fn (string $bl): bool => $bl !== '')
            ->unique()
            ->values()
            ->all();

        return [
            'id' => $ids,
            'bl_no' => $blNumbers,
            'type' => strtolower(trim((string) $this->option('type'))) ?: 'any',
        ];
    }
}
