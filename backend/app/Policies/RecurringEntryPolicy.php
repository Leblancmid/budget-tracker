<?php

namespace App\Policies;

use App\Models\RecurringEntry;
use App\Models\User;

/** Users can only see and change their own recurring entries. */
class RecurringEntryPolicy
{
    public function update(User $user, RecurringEntry $entry): bool
    {
        return $user->id === $entry->user_id;
    }

    public function delete(User $user, RecurringEntry $entry): bool
    {
        return $user->id === $entry->user_id;
    }
}
