<?php

namespace App\Http\Middleware;

use App\Services\Undo\OperationLabel;
use App\Services\Undo\OperationRecorder;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Turns each request that changes data into one undoable operation (Master File → Undo).
 * Only requests that succeed are kept: a rejected or failed one changed nothing.
 */
class RecordOperation
{
    /** Signing in and out, and the undo itself (which records its own operation). */
    private const NOT_RECORDED = ['auth.', 'master.operations.'];

    public function handle(Request $request, Closure $next): Response
    {
        if (! in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            return $next($request);
        }

        OperationRecorder::begin();
        try {
            $response = $next($request);
        } catch (Throwable $e) {
            OperationRecorder::discard();
            throw $e;
        }

        $route = (string) $request->route()?->getName();
        $skip = collect(self::NOT_RECORDED)->contains(fn ($p) => str_starts_with($route, $p));
        if ($response->getStatusCode() >= 400 || $skip) {
            OperationRecorder::discard();
        } else {
            OperationRecorder::finish($request->user()?->id, OperationLabel::forRequest($request, OperationRecorder::pending()), $route ?: null);
        }

        return $response;
    }
}
