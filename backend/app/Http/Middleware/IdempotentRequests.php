<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Changes made offline on the phone are sent later (after you approve them) with an
 * Idempotency-Key. If the same key arrives again (the first answer was lost on the way back),
 * the first answer is returned instead of doing the change twice.
 */
class IdempotentRequests
{
    /** How long a key is remembered */
    private const KEEP_HOURS = 48;

    public function handle(Request $request, Closure $next): Response
    {
        $key = $request->header('Idempotency-Key');
        if (! $key || $request->isMethodSafe() || ! preg_match('/^[A-Za-z0-9-]{8,100}$/', $key)) {
            return $next($request);
        }

        // Per signed-in user, so one person's key can never return another's answer
        $id = 'idempotency:' . ($request->user('sanctum')?->getAuthIdentifier() ?? 'guest') . ':' . $key;

        if ($saved = Cache::get($id)) {
            return response($saved['body'], $saved['status'], ['Content-Type' => 'application/json', 'Idempotent-Replay' => 'true']);
        }

        // The same change arriving twice at once: the second waits its turn instead of running alongside
        $lock = Cache::lock($id . ':lock', 30);
        if (! $lock->get()) {
            return response()->json(['message' => 'This change is already being saved. Try again in a moment.'], 409);
        }

        try {
            if ($saved = Cache::get($id)) {
                return response($saved['body'], $saved['status'], ['Content-Type' => 'application/json', 'Idempotent-Replay' => 'true']);
            }
            $response = $next($request);
            // Remember a definite answer (saved, or refused with a reason); not a server hiccup worth retrying
            if ($response->getStatusCode() < 500 && ! in_array($response->getStatusCode(), [401, 419, 429], true)) {
                Cache::put($id, ['status' => $response->getStatusCode(), 'body' => $response->getContent()], now()->addHours(self::KEEP_HOURS));
            }

            return $response;
        } finally {
            $lock->release();
        }
    }
}
