<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\Rucoy\StoreMiddlemanFeeRequest;
use App\Models\MiddlemanFee;
use App\Services\GoldInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class MiddlemanFeeController extends Controller
{
    public function index(): JsonResponse
    {
        $fees  = MiddlemanFee::latest()->get();
        $total = $fees->sum(fn ($f) => (float) $f->amount);

        return response()->json(['fees' => $fees, 'total' => $total]);
    }

    public function store(StoreMiddlemanFeeRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $fee = DB::transaction(function () use ($validated) {
            // Same as Add Gold: into the stash and the gold history
            GoldInventory::record((float) $validated['amount'], $validated['description'] ?? null, 'fee');

            return MiddlemanFee::create($validated);
        });

        return response()->json($fee, 201);
    }

    public function destroy(MiddlemanFee $middlemanFee): JsonResponse
    {
        $middlemanFee->delete();

        return response()->json(['message' => 'Fee deleted.']);
    }
}
