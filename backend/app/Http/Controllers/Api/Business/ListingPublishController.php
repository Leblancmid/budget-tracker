<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Services\ListingPublisher;
use Illuminate\Http\JsonResponse;
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

    public function publish(ListingPublisher $publisher): JsonResponse
    {
        try {
            return response()->json($publisher->publish());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
