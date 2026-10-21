<?php

namespace App\Observers;

class SavingObserver extends ActivityLogObserver
{
    protected function module(): string
    {
        return 'savings';
    }
}
