<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Route guard per part of the app: `module:trading` lets through users who can open Trading,
 * `module:trading,wallets` users who can open either. Everyone else gets 403.
 */
class EnsureModule
{
    public function handle(Request $request, Closure $next, string ...$modules): Response
    {
        $user = $request->user();
        if (! $user || ! collect($modules)->contains(fn ($m) => $user->canUse($m))) {
            return response()->json(['message' => 'You are not allowed to access this.'], 403);
        }

        return $next($request);
    }
}
