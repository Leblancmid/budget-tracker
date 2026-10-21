<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

/** Rows that are "archived" (sold / closed) by setting archived_at. */
trait Archivable
{
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('archived_at');
    }

    public function scopeArchived(Builder $query): Builder
    {
        return $query->whereNotNull('archived_at');
    }
}
