<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Someone signed in with a password an admin chose for them can only replace it (or sign out)
 * until they do: everything else answers 403 with code "password_change_required".
 */
class EnsurePasswordChosen
{
    /** What still works while a new password is needed */
    private const ALLOWED = ['auth.logout', 'auth.logout-all', 'profile.show', 'profile.password.update'];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->must_change_password && ! in_array($request->route()?->getName(), self::ALLOWED, true)) {
            return response()->json([
                'message' => 'Choose your own password first.',
                'code'    => 'password_change_required',
            ], 403);
        }

        return $next($request);
    }
}
