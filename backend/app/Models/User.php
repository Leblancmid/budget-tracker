<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLES = ['admin', 'trader', 'daily_only'];

    /**
     * The parts of the app access is given for. Daily Expenses (your own entries) is everyone's.
     * trading: Business and Rucoy together (each screen uses the other's data).
     * storefront: the public website: Listing Kit and publishing, website gold rates, leads. Needs
     *   trading too (it lists Trading's accounts), so it only counts alongside it.
     * wallets: the Balance page and linking entries to a wallet.
     * master: Master File (net worth overview; logs and undo of your own actions, everyone's for admins).
     */
    public const MODULES = ['daily', 'trading', 'storefront', 'wallets', 'master'];

    /** What each role gets unless an admin picks modules for that person. Admins always get everything. */
    public const PRESETS = [
        'admin'      => self::MODULES,
        'trader'     => ['daily', 'trading', 'storefront'],
        'daily_only' => ['daily'],
    ];

    /** avatar_path and deactivated_at are set by UserAccounts only, never mass-assigned from a request. */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'modules',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'deactivated_at'    => 'datetime',
            'password'          => 'hashed',
            'modules'           => 'array',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /** The modules this person can open: everything for admins, else their own pick or their role's. */
    public function modules(): array
    {
        if ($this->isAdmin()) {
            return self::MODULES;
        }
        $chosen = $this->modules ?: (self::PRESETS[$this->role] ?? ['daily']);

        $modules = array_values(array_intersect(self::MODULES, array_unique([...$chosen, 'daily'])));

        // The storefront shows Trading's accounts: without Trading it opens nothing
        return in_array('trading', $modules, true) ? $modules : array_values(array_diff($modules, ['storefront']));
    }

    public function canUse(string $module): bool
    {
        return in_array($module, $this->modules(), true);
    }

    public function isActive(): bool
    {
        return $this->deactivated_at === null;
    }

    public function avatarUrl(): ?string
    {
        return $this->avatar_path ? asset('storage/' . $this->avatar_path) : null;
    }
}
