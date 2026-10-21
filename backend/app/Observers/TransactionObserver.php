<?php

namespace App\Observers;

class TransactionObserver extends ActivityLogObserver
{
    protected function module(): string
    {
        return 'daily';
    }
}
