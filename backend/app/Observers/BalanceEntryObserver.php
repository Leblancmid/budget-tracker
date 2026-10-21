<?php

namespace App\Observers;

class BalanceEntryObserver extends ActivityLogObserver
{
    protected function module(): string
    {
        return 'balance';
    }
}
