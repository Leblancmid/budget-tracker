<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ChangeUserStatusRequest;
use App\Http\Requests\Users\ListUsersRequest;
use App\Http\Requests\Users\SetUserPasswordRequest;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Requests\Users\UserSessionsRequest;
use App\Models\ActivityLog;
use App\Models\User;
use App\Services\UserAccounts;
use Illuminate\Http\JsonResponse;

/**
 * User management (admins only). Accounts are turned off rather than deleted: deleting one would
 * also delete that person's expenses and their part of the audit log.
 */
class UserController extends Controller
{
    private const PER_PAGE = 10;

    public function index(ListUsersRequest $request): JsonResponse
    {
        $search = trim((string) $request->validated('search'));
        $status = $request->validated('status');

        $page = User::query()
            ->withMax('tokens', 'last_used_at')
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%")))
            ->when($request->validated('role'), fn ($q, $role) => $q->where('role', $role))
            ->when($status === 'active', fn ($q) => $q->whereNull('deactivated_at'))
            ->when($status === 'deactivated', fn ($q) => $q->whereNotNull('deactivated_at'))
            ->orderByRaw('deactivated_at IS NOT NULL')->orderBy('name')
            ->paginate($request->integer('per_page', self::PER_PAGE));

        $viewerId = $request->user()->id;
        $page->getCollection()->transform(fn (User $u) => UserAccounts::present($u, $viewerId));

        return response()->json([
            ...$page->toArray(),
            'counts' => [
                'all'         => User::count(),
                'admin'       => User::where('role', 'admin')->whereNull('deactivated_at')->count(),
                'trader'      => User::where('role', 'trader')->whereNull('deactivated_at')->count(),
                'daily_only'  => User::where('role', 'daily_only')->whereNull('deactivated_at')->count(),
                'deactivated' => User::whereNotNull('deactivated_at')->count(),
            ],
        ]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::create([...$data, ...UserAccounts::access($data)]);
        // The first password is the admin's pick: the person replaces it at their first sign-in
        $user->forceFill(['must_change_password' => true])->save();

        return response()->json(['user' => UserAccounts::present($user, $request->user()->id)], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $data = $request->validated();
        $access = isset($data['role']) || array_key_exists('modules', $data) ? UserAccounts::access($data, $user) : [];
        $user->fill([...$data, ...$access])->save();
        $user->loadMax('tokens', 'last_used_at');

        return response()->json(['user' => UserAccounts::present($user, $request->user()->id)]);
    }

    /** A new password; the user is signed out everywhere and signs in again with it. */
    public function updatePassword(SetUserPasswordRequest $request, User $user): JsonResponse
    {
        UserAccounts::setPassword($user, $request->validated('password'));

        return response()->json(['message' => "New password set. {$user->name} was signed out everywhere."]);
    }

    /**
     * One person, in detail: their account, the devices they're signed in on, failed sign-ins on
     * their email, and what they did lately.
     */
    public function show(ListUsersRequest $request, User $user): JsonResponse
    {
        $user->loadMax('tokens', 'last_used_at');
        $failed = ActivityLog::where('module', 'access')->whereIn('type', ['sign_in_failed', 'locked_out'])
            ->where('loggable_type', User::class)->where('loggable_id', $user->id);

        return response()->json([
            'user'     => UserAccounts::present($user, $request->user()->id),
            'sessions' => UserAccounts::sessions($user, null),
            'failed_sign_ins' => [
                'last_30_days' => (clone $failed)->where('created_at', '>=', now()->subDays(30))->count(),
                'recent'       => (clone $failed)->latest('id')->limit(5)->get(['type', 'description', 'ip_address', 'user_agent', 'created_at']),
            ],
            'activity' => ActivityLog::where('user_id', $user->id)->latest('id')->limit(30)
                ->get(['id', 'module', 'type', 'description', 'amount', 'ip_address', 'user_agent', 'created_at']),
        ]);
    }

    /** Sign out one of someone's devices. */
    public function destroySession(UserSessionsRequest $request, User $user, int $token): JsonResponse
    {
        $session = $user->tokens()->whereKey($token)->firstOrFail();
        $session->delete();
        ActivityLog::note('access', 'signed_out', "Signed {$user->name} out of a device: " . mb_strimwidth($session->name, 0, 100, '…'), $user);

        return response()->json(['message' => 'Device signed out.']);
    }

    /** Sign someone out everywhere (without turning their account off). */
    public function signOutEverywhere(UserSessionsRequest $request, User $user): JsonResponse
    {
        $count = $user->tokens()->delete();
        ActivityLog::note('access', 'signed_out_all', "Signed {$user->name} out of all devices", $user);

        return response()->json(['message' => $count ? "{$user->name} was signed out of {$count} device" . ($count === 1 ? '' : 's') . '.' : "{$user->name} wasn't signed in anywhere."]);
    }

    public function deactivate(ChangeUserStatusRequest $request, User $user): JsonResponse
    {
        UserAccounts::deactivate($user);

        return response()->json(['user' => UserAccounts::present($user, $request->user()->id)]);
    }

    public function reactivate(ChangeUserStatusRequest $request, User $user): JsonResponse
    {
        UserAccounts::reactivate($user);

        return response()->json(['user' => UserAccounts::present($user, $request->user()->id)]);
    }
}
