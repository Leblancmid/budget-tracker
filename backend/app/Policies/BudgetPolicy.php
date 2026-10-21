<?php

namespace App\Policies;

use App\Models\Budget;
use App\Models\User;

/** Users can only change their own budgets. */
class BudgetPolicy
{
    public function update(User $user, Budget $budget): bool
    {
        return $user->id === $budget->user_id;
    }

    public function delete(User $user, Budget $budget): bool
    {
        return $user->id === $budget->user_id;
    }
}
