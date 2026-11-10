<?php

namespace App\Models\Concerns;

/** Bulk updates and deletes on this model are recorded for Undo too (see JournaledBuilder). */
trait Journaled
{
    public function newEloquentBuilder($query): JournaledBuilder
    {
        return new JournaledBuilder($query);
    }
}
