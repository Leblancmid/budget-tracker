<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateAvatarRequest;
use App\Http\Requests\Profile\UpdatePasswordRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Models\ActivityLog;
use App\Services\UserAccounts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

/** Your own account: name, email, profile picture, password and the devices you're signed in on. */
class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMax('tokens', 'last_used_at');

        return response()->json([
            'user'     => UserAccounts::present($user, $user->id),
            'sessions' => UserAccounts::sessions($user, $this->currentTokenId($request)),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated())->save();

        return response()->json(['user' => UserAccounts::present($user, $user->id)]);
    }

    public function updateAvatar(UpdateAvatarRequest $request): JsonResponse
    {
        $user = $request->user();
        UserAccounts::setAvatar($user, $request->file('avatar'));

        return response()->json(['user' => UserAccounts::present($user, $user->id)]);
    }

    public function destroyAvatar(Request $request): JsonResponse
    {
        $user = $request->user();
        UserAccounts::removeAvatar($user);

        return response()->json(['user' => UserAccounts::present($user, $user->id)]);
    }

    /** New password; every other device is signed out, this one stays signed in. */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        UserAccounts::setPassword($request->user(), $request->validated('password'), $this->currentTokenId($request));

        return response()->json(['message' => 'Password changed. Your other devices were signed out.']);
    }

    /** Sign out one of your other devices. */
    public function destroySession(Request $request, int $token): JsonResponse
    {
        $session = $request->user()->tokens()->whereKey($token)->firstOrFail();
        if ($session->id === $this->currentTokenId($request)) {
            return response()->json(['message' => 'Use Sign out to sign out of this device.'], 422);
        }

        $session->delete();
        ActivityLog::note('access', 'signed_out', 'Signed out a device: ' . mb_strimwidth($session->name, 0, 120, '…'), $request->user());

        return response()->json(['message' => 'Device signed out.']);
    }

    private function currentTokenId(Request $request): ?int
    {
        $token = $request->user()?->currentAccessToken();

        return $token instanceof PersonalAccessToken ? $token->id : null;
    }
}
