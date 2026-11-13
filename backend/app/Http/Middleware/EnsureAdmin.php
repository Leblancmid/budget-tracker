<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Admins only (user management). The rest of the app is opened per module: see EnsureModule.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(['message' => 'You are not allowed to access this.'], 403);
        }

        return $next($request);
    }
}
