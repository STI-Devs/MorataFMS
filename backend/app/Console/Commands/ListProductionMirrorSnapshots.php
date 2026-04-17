<?php

namespace App\Console\Commands;

use App\Support\Operations\ProductionMirrorManager;
use Illuminate\Console\Command;

class ListProductionMirrorSnapshots extends Command
{
    protected $signature = 'ops:list-production-mirror-snapshots';

    protected $description = 'List the locally stored production mirror SQL snapshots.';

    public function __construct(private ProductionMirrorManager $productionMirrorManager)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        $snapshots = $this->productionMirrorManager->listSnapshots();

        if ($snapshots === []) {
            $this->warn('No production mirror snapshots were found.');

            return self::SUCCESS;
        }

        $this->table(
            ['Latest', 'Filename', 'Modified', 'Size (bytes)', 'Path'],
            array_map(
                static fn (array $snapshot): array => [
                    $snapshot['is_latest'] ? 'yes' : '',
                    $snapshot['name'],
                    $snapshot['modified_at'],
                    (string) $snapshot['size'],
                    $snapshot['path'],
                ],
                $snapshots
            )
        );

        return self::SUCCESS;
    }
}
