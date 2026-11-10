<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\UpdateGoldRatesRequest;
use App\Models\ActivityLog;
use App\Services\ListingPublisher;
use App\Services\PriceGuide;
use App\Services\WebsiteContent;
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

    /** Gold rates for the website, with your recent sell / buy rates as a guide. */
    public function goldRates(): JsonResponse
    {
        return response()->json(['gold' => WebsiteContent::gold(), 'guide' => PriceGuide::gold()]);
    }

    /** Save the gold rates; they go live on the next "Publish to website". */
    public function updateGoldRates(UpdateGoldRatesRequest $request): JsonResponse
    {
        WebsiteContent::saveGold($request->validated());

        return $this->goldRates();
    }

    /** Remove a buyer's "Notify me" request (bought already, changed their mind, spam). */
    public function deleteAlert(int $alert): JsonResponse
    {
        try {
            WebsiteStats::deleteAlert($alert);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
        ActivityLog::note('business', 'removed', "Removed: website \"Notify me\" request #{$alert}");

        return response()->json(['message' => 'Request removed.']);
    }

    public function publish(ListingPublisher $publisher): JsonResponse
    {
        try {
            $result = $publisher->publish();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
        ActivityLog::note('business', 'published', 'Published listings to the website');

        return response()->json($result);
    }
}
