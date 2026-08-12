<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Models\MiddlemanFee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MiddlemanFeeController extends Controller
{
    public function index(): JsonResponse
    {
        $fees  = MiddlemanFee::latest()->get();
        $total = $fees->sum(fn($f) => (float) $f->amount);

        return response()->json(['fees' => $fees, 'total' => $total]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $feeAmount = (float) $validated['amount'];

        // Add to gold stash (same logic as Add Gold)
        Gold::create([
            'amount'      => $feeAmount,
            'description' => $validated['description'] ?? null,
        ]);

        // Record in transaction history
        GoldLog::create([
            'type'        => 'fee',
            'amount'      => $feeAmount,
            'description' => $validated['description'] ?? null,
        ]);

        $fee = MiddlemanFee::create($validated);

        return response()->json($fee, 201);
    }

    public function destroy(MiddlemanFee $middlemanFee): JsonResponse
    {
        $middlemanFee->delete();

        return response()->json(['message' => 'Fee deleted.']);
    }
}
