<?php

namespace App\Console\Commands;

use App\Services\BalanceInterest;
use App\Services\Undo\OperationRecorder;
use Illuminate\Console\Command;

class CreditBalanceInterest extends Command
{
    protected $signature = 'balance:interest';

    protected $description = 'Credit daily interest to Balance accounts that have an interest rate (catches up missed days)';

    public function handle(): int
    {
        // One undoable operation per run that credits something (Master File → Undo)
        $count = OperationRecorder::run('Credited daily interest', fn () => BalanceInterest::accrueAll());
        $this->info($count ? "Credited {$count} day(s) of interest." : 'Interest is up to date.');

        return self::SUCCESS;
    }
}
