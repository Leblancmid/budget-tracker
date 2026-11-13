<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\PushSubscriptionRequest;
use App\Models\PushSubscription;
use App\Services\PhoneAlerts;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/** Phone alerts for your own devices: turn on, turn off, send a test. */
class PushController extends Controller
{
    /** Whether the server can send alerts, and the public key a device needs to sign up. */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'configured' => PhoneAlerts::configured(),
            'public_key' => config('services.webpush.public_key'),
            'devices'    => PushSubscription::where('user_id', $request->user()->id)->count(),
        ]);
    }

    public function store(PushSubscriptionRequest $request): JsonResponse
    {
        if (! PhoneAlerts::configured()) {
            return response()->json(['message' => 'Phone alerts aren\'t set up on the server yet.'], 409);
        }
        $request->validate(['keys.p256dh' => 'required', 'keys.auth' => 'required']);
        $endpoint = $request->validated('endpoint');

        // A device belongs to whoever turned alerts on there last (e.g. a shared phone)
        PushSubscription::updateOrCreate(['endpoint_hash' => PushSubscription::hashOf($endpoint)], [
            'user_id'    => $request->user()->id,
            'endpoint'   => $endpoint,
            'public_key' => $request->input('keys.p256dh'),
            'auth_token' => $request->input('keys.auth'),
            'device'     => Str::limit((string) $request->userAgent(), 200, ''),
        ]);

        return response()->json(['message' => 'Phone alerts are on for this device.'], 201);
    }

    public function destroy(PushSubscriptionRequest $request): JsonResponse
    {
        PushSubscription::where('user_id', $request->user()->id)
            ->where('endpoint_hash', PushSubscription::hashOf($request->validated('endpoint')))->delete();

        return response()->json(['message' => 'Phone alerts are off for this device.']);
    }

    public function test(Request $request): JsonResponse
    {
        $sent = PhoneAlerts::send($request->user(), 'Test alert', 'Phone alerts work on this device.', '/profile');

        return $sent > 0
            ? response()->json(['message' => "Sent to {$sent} device" . ($sent === 1 ? '' : 's') . '.'])
            : response()->json(['message' => 'Couldn\'t send: turn alerts on for this device first, or the server isn\'t set up yet.'], 409);
    }
}
