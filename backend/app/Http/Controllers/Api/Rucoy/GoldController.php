<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGoldRequest;
use App\Http\Requests\UpdateGoldRequest;
use App\Models\Gold;
use App\Models\GoldLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoldController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Gold::latest()->get());
    }

    public function store(StoreGoldRequest $request): JsonResponse
    {
        $gold = Gold::create($request->validated());

        GoldLog::create([
            'type'        => 'add',
            'amount'      => $gold->amount,
            'description' => $gold->description,
        ]);

        return response()->json($gold, 201);
    }

    public function sell(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $sellAmount = (float) $validated['amount'];

        $remaining = $sellAmount;
        foreach (Gold::orderByDesc('amount')->get() as $gold) {
            if ($remaining <= 0) break;
            $current = (float) $gold->amount;
            $deduct  = min($current, $remaining);
            $gold->update(['amount' => $current - $deduct]);
            $remaining -= $deduct;
        }

        if ($remaining > 0) {
            Gold::create(['amount' => -$remaining, 'description' => null]);
        }

        GoldLog::create([
            'type'        => 'sell',
            'amount'      => $sellAmount,
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json(Gold::latest()->get());
    }

    public function logs(): JsonResponse
    {
        return response()->json(GoldLog::latest()->get());
    }

    public function update(UpdateGoldRequest $request, Gold $gold): JsonResponse
    {
        $gold->update($request->validated());

        return response()->json($gold);
    }

    public function destroy(Gold $gold): JsonResponse
    {
        if ($gold->trades()->exists()) {
            return response()->json(['message' => 'Cannot delete gold with existing trades.'], 422);
        }

        $gold->delete();

        return response()->json(['message' => 'Gold deleted.']);
    }
}
