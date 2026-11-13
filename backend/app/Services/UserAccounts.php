<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Everything done to a user account outside a plain name / email / role edit: the profile picture,
 * passwords, signing devices out, and turning an account off or back on. Each one is logged (never
 * with the password itself).
 */
class UserAccounts
{
    /** How a user is sent to the app (profile, header, user list). */
    public static function present(User $user, ?int $viewerId = null): array
    {
        $lastActive = $user->getAttribute('tokens_max_last_used_at');

        return [
            'id'             => $user->id,
            'name'           => $user->name,
            'email'          => $user->email,
            'role'           => $user->role,
            'modules'        => $user->modules(),
            'avatar_url'     => $user->avatarUrl(),
            'deactivated_at' => $user->deactivated_at?->toIso8601String(),
            'must_change_password' => (bool) $user->must_change_password,
            'created_at'     => $user->created_at?->toIso8601String(),
            'last_active_at' => $lastActive ? Carbon::parse($lastActive)->toIso8601String() : null,
            'is_self'        => $viewerId !== null && $viewerId === $user->id,
        ];
    }

    /**
     * The role and modules to store from an add / edit form. Admins always get everything (stored
     * empty). A pick that matches the role's preset is stored empty too, so it follows the role.
     * Changing the role without picking modules goes back to that role's preset.
     */
    public static function access(array $data, ?User $existing = null): array
    {
        $role = $data['role'] ?? $existing?->role ?? 'daily_only';

        if ($role === 'admin') {
            return ['role' => $role, 'modules' => null];
        }
        if (array_key_exists('modules', $data)) {
            // In the app's order, always with Daily Expenses
            $picked = array_values(array_intersect(User::MODULES, [...($data['modules'] ?? []), 'daily']));
            $preset = array_values(array_intersect(User::MODULES, User::PRESETS[$role]));

            return ['role' => $role, 'modules' => $picked === $preset ? null : $picked];
        }
        if ($existing === null || $existing->role !== $role) {
            return ['role' => $role, 'modules' => null];
        }

        return ['role' => $role];
    }

    /** Replace the profile picture. The stored name is generated, never the uploaded one. */
    public static function setAvatar(User $user, UploadedFile $file): void
    {
        $old = $user->avatar_path;
        $user->forceFill(['avatar_path' => $file->store('avatars', 'public')])->save();
        self::deleteFile($old);
        ActivityLog::note('access', 'edited', 'Changed profile picture: ' . $user->name, $user);
    }

    public static function removeAvatar(User $user): void
    {
        if (! $user->avatar_path) {
            return;
        }
        $old = $user->avatar_path;
        $user->forceFill(['avatar_path' => null])->save();
        self::deleteFile($old);
        ActivityLog::note('access', 'edited', 'Removed profile picture: ' . $user->name, $user);
    }

    /**
     * Set a new password. Every other device is signed out; $keepTokenId (the device making the
     * change, when it's the user's own) stays signed in.
     */
    public static function setPassword(User $user, string $password, ?int $keepTokenId = null): void
    {
        // A password someone else chose must be replaced by the person before they use the app
        $own = auth()->id() === $user->id;
        $user->forceFill(['password' => $password, 'must_change_password' => ! $own])->save();
        $user->tokens()->when($keepTokenId, fn ($q) => $q->where('id', '!=', $keepTokenId))->delete();

        ActivityLog::note('access', 'edited', $own ? 'Changed own password' : 'Set a new password for ' . $user->name, $user);
    }

    /** Turn an account off: it can't sign in, and every device it's signed in on is signed out. */
    public static function deactivate(User $user): void
    {
        if (! $user->isActive()) {
            return;
        }
        $user->forceFill(['deactivated_at' => now()])->save();
        $user->tokens()->delete();
        ActivityLog::note('access', 'edited', 'Deactivated user: ' . $user->name, $user);
    }

    public static function reactivate(User $user): void
    {
        if ($user->isActive()) {
            return;
        }
        $user->forceFill(['deactivated_at' => null])->save();
        ActivityLog::note('access', 'edited', 'Reactivated user: ' . $user->name, $user);
    }

    /** The devices a user is signed in on, most recently used first. */
    public static function sessions(User $user, ?int $currentTokenId): array
    {
        return $user->tokens()
            ->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->orderByRaw('COALESCE(last_used_at, created_at) DESC')
            ->get()
            ->map(fn (PersonalAccessToken $t) => [
                'id'           => $t->id,
                'device'       => $t->name,
                'created_at'   => $t->created_at?->toIso8601String(),
                'last_used_at' => $t->last_used_at?->toIso8601String(),
                'expires_at'   => $t->expires_at?->toIso8601String(),
                'current'      => $t->id === $currentTokenId,
            ])->all();
    }

    private static function deleteFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }
}
