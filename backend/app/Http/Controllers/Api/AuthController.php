<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $user     = $request->authenticate();
        $remember = $request->boolean('remember');
        $minutes  = config($remember ? 'auth.token_lifetime.remember' : 'auth.token_lifetime.session');
        $expires  = now()->addMinutes($minutes);

        // Old tokens that can no longer be used are just clutter
        $user->tokens()->where('expires_at', '<', now())->delete();

        $token = $user->createToken($this->deviceName($request), ['*'], $expires)->plainTextToken;

        return response()->json([
            'token'      => $token,
            'expires_at' => $expires->toIso8601String(),
            'remember'   => $remember,
            'user'       => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    /** Signs out every device, including this one. */
    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()?->tokens()->delete();

        return response()->json(['message' => 'Logged out of all devices.']);
    }

    /** Token name, so tokens can be told apart (e.g. when reviewing sign-ins). */
    private function deviceName(Request $request): string
    {
        return Str::limit((string) ($request->userAgent() ?: 'api'), 200, '');
    }
}
