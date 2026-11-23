<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\UpdateReviewRequest;
use App\Models\ActivityLog;
use App\Models\BusinessTransaction;
use App\Services\Reviews;
use App\Services\WebsiteStats;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/**
 * Buyer reviews: a review link to send after a sale, and the reviews from the website to approve
 * (approved ones show on the site). The website keeps them.
 */
class ReviewController extends Controller
{
    public function index(): JsonResponse
    {
        if (! WebsiteStats::configured()) {
            return response()->json(['configured' => false, 'reviews' => [], 'recent_sales' => []]);
        }
        try {
            $reviews = Reviews::all();
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json(['configured' => true, 'reviews' => $reviews, 'recent_sales' => Reviews::recentSales($reviews)]);
    }

    public function update(UpdateReviewRequest $request, int $review): JsonResponse
    {
        $status = $request->validated('status');
        try {
            Reviews::setStatus($review, $status);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
        ActivityLog::note('business', 'edited', "Review #{$review}: {$status}");

        return response()->json(['message' => $status === 'approved' ? 'Approved: it shows on the website now.' : 'Updated.']);
    }

    /** The review link for a sold account or gold trade, to send to the buyer. */
    public function link(BusinessTransaction $businessTransaction): JsonResponse
    {
        try {
            $url = Reviews::link($businessTransaction);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['url' => $url, 'item' => Reviews::label($businessTransaction), 'days' => Reviews::LINK_DAYS]);
    }
}
