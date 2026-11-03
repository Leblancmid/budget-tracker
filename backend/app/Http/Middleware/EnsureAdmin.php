<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Business, Rucoy, Master, logs and business reports are admin-only.
 * daily_only users can reach only their own Daily Expenses data.
 */
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->role === 'daily_only') {
            return response()->json(['message' => 'You are not allowed to access this.'], 403);
        }

        return $next($request);
    }
}
