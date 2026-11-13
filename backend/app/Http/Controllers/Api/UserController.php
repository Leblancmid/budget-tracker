<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ChangeUserStatusRequest;
use App\Http\Requests\Users\ListUsersRequest;
use App\Http\Requests\Users\SetUserPasswordRequest;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
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
