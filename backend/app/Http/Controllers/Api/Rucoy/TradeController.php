<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTradeRequest;
use App\Http\Requests\UpdateTradeRequest;
use App\Models\Trade;
use Illuminate\Http\JsonResponse;

class TradeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Trade::whereNull('archived_at')->latest()->get());
    }

    public function archived(): JsonResponse
    {
        return response()->json(Trade::whereNotNull('archived_at')->latest('archived_at')->get());
    }

    public function store(StoreTradeRequest $request): JsonResponse
    {
        $trade = Trade::create($request->validated());

        return response()->json($trade, 201);
    }

    public function update(UpdateTradeRequest $request, Trade $trade): JsonResponse
    {
        $trade->update($request->validated());

        return response()->json($trade->fresh());
    }

    public function archive(Trade $trade): JsonResponse
    {
        $trade->archived_at = now();
        $trade->save();

        return response()->json($trade->fresh());
    }

    public function unarchive(Trade $trade): JsonResponse
    {
        $trade->archived_at = null;
        $trade->save();

        return response()->json($trade->fresh());
    }

    public function destroy(Trade $trade): JsonResponse
    {
        $trade->delete();

        return response()->json(['message' => 'Trade deleted.']);
    }
}
