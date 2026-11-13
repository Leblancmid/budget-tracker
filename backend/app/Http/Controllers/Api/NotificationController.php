<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

/** Your own in-app notifications (the bell): newest first, mark one or all as read. */
class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $items = $user->notifications()->reorder()->latest()->orderByDesc('id')->limit(20)->get()->map(fn (DatabaseNotification $n) => [
            'id'         => $n->id,
            ...$n->data,
            'read_at'    => $n->read_at?->toIso8601String(),
            'created_at' => $n->created_at?->toIso8601String(),
        ]);

        return response()->json(['data' => $items, 'unread' => $user->unreadNotifications()->count()]);
    }

    public function read(Request $request, string $notification): JsonResponse
    {
        // Only your own: someone else's id is simply not found
        $request->user()->notifications()->whereKey($notification)->firstOrFail()->markAsRead();

        return response()->json(['unread' => $request->user()->unreadNotifications()->count()]);
    }

    public function readAll(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications()->update(['read_at' => now()]);

        return response()->json(['unread' => 0]);
    }
}
