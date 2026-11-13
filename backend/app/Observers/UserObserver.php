<?php

namespace App\Observers;

use Illuminate\Database\Eloquent\Model;

/**
 * Adding a user, and edits to their name, email or role, with before → after. The password, the
 * profile picture and turning an account off are logged by UserAccounts with a plain sentence
 * instead, so a password hash or a file path never lands in the log.
 */
class UserObserver extends RecordLogObserver
{
    protected array $ignoredOnEdit = [
        'updated_at', 'created_at', 'password', 'remember_token', 'email_verified_at', 'avatar_path', 'deactivated_at', 'must_change_password',
    ];

    protected function module(): string
    {
        return 'access';
    }

    protected function noun(): string
    {
        return 'User';
    }

    protected function name(Model $model): string
    {
        return $model->name . ' (' . $model->email . ')';
    }
}
