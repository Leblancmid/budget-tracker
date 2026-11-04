<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\PriceGuideRequest;
use App\Services\BusinessBrief;
use App\Services\PriceGuide;
use Illuminate\Http\JsonResponse;

/** Rule-based insights from your own numbers: the weekly brief and the price guide. */
class InsightsController extends Controller
{
    public function brief(): JsonResponse
    {
        return response()->json(BusinessBrief::build());
    }

    public function priceGuide(PriceGuideRequest $request): JsonResponse
    {
        $data = $request->validated();

        return response()->json([
            'account' => PriceGuide::account($data['level'] ?? null, $data['class'] ?? null, $data['exclude_id'] ?? null),
            'gold'    => PriceGuide::gold(),
        ]);
    }
}
