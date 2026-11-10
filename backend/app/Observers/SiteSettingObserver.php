<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/** Website settings saved from the app, e.g. the gold rates shown on the storefront. */
class SiteSettingObserver extends RecordLogObserver
{
    protected function module(): string
    {
        return 'business';
    }

    protected function noun(): string
    {
        return 'Website';
    }

    protected function name(Model $model): string
    {
        return Str::ucfirst(str_replace('_', ' ', $model->key));
    }
}
