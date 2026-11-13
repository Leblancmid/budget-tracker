<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\AppAlert;
use Illuminate\Support\Collection;

/** Who gets which business alerts, and sending each one only once. */
class Alerts
{
    /** Active people who can open this module */
    public static function peopleWith(string $module): Collection
    {
        return User::whereNull('deactivated_at')->get()->filter(fn (User $u) => $u->canUse($module))->values();
    }

    /** Send unless this person already got the alert with this key. @return bool sent */
    public static function once(User $user, AppAlert $alert): bool
    {
        if ($alert->key !== null && $user->notifications()->where('data', 'like', '%"key":' . json_encode($alert->key) . '%')->exists()) {
            return false;
        }
        $user->notify($alert);

        return true;
    }

    /** @return int how many people it was sent to */
    public static function toEveryoneWith(string $module, AppAlert $alert): int
    {
        return self::peopleWith($module)->filter(fn (User $u) => self::once($u, $alert))->count();
    }

    /** For things only admins act on (backups, the server). @return int how many it was sent to */
    public static function toAdmins(AppAlert $alert): int
    {
        return User::whereNull('deactivated_at')->where('role', 'admin')->get()->filter(fn (User $u) => self::once($u, $alert))->count();
    }
}
