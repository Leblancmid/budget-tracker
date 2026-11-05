<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Services\ListingPublisher;
use App\Services\WebsiteStats;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Publish the accounts for sale to the Leblanc website (writes, commits and pushes its repo).
 * The commit in that repo is the record of each publish.
 */
class ListingPublishController extends Controller
{
    public function preview(ListingPublisher $publisher): JsonResponse
    {
        return response()->json($publisher->preview());
    }

    /** Website visitors: online now, visits per day, views per listing, "Notify me" requests. */
    public function stats(Request $request): JsonResponse
    {
        if (! WebsiteStats::configured()) {
            return response()->json(['configured' => false]);
        }
        try {
            return response()->json(['configured' => true, ...WebsiteStats::fetch($request->boolean('fresh'))]);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
    }

    public function publish(ListingPublisher $publisher): JsonResponse
    {
        try {
            return response()->json($publisher->publish());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
