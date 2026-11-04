<?php

namespace App\Console\Commands;

use App\Services\RecurringEntries;
use Illuminate\Console\Command;

class PostRecurringEntries extends Command
{
    protected $signature = 'recurring:post';

    protected $description = 'Post recurring daily transactions that are due (catches up missed dates)';

    public function handle(): int
    {
        $count = RecurringEntries::postDue();
        $this->info($count ? "Posted {$count} recurring transaction(s)." : 'Nothing due.');

        return self::SUCCESS;
    }
}
