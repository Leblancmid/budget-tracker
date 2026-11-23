<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\PriceGuideRequest;
use App\Services\BusinessBrief;
use App\Services\LikelyBuyers;
use App\Services\PriceGuide;
use App\Services\StockAging;
use Illuminate\Http\JsonResponse;

/** Rule-based insights from your own numbers: the weekly brief and the price guide. */
class InsightsController extends Controller
{
    public function brief(): JsonResponse
    {
        return response()->json(BusinessBrief::build());
    }

    /** Money in stock: unsold accounts and gold, what they cost, how long they've sat, what they'd bring. */
    public function stock(): JsonResponse
    {
        return response()->json(StockAging::build());
    }

    public function priceGuide(PriceGuideRequest $request): JsonResponse
    {
        $data = $request->validated();

        $level = $data['level'] ?? null;
        $class = $data['class'] ?? null;

        return response()->json([
            'account' => PriceGuide::account($level, $class, $data['exclude_id'] ?? null),
            'gold'    => PriceGuide::gold(),
            // Past buyers of one like it (who'd buy it from you): for "Should I buy this?"
            'regulars' => $level && $class ? count(LikelyBuyers::forLevel((int) $level, $class)) : null,
        ]);
    }
}
