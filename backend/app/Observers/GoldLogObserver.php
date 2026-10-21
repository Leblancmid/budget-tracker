<?php

namespace App\Observers;

class GoldLogObserver extends ActivityLogObserver
{
    protected function module(): string
    {
        return 'gold';
    }
}
