<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreBalanceEntryRequest;
use App\Http\Requests\Master\UpdateBalanceEntryRequest;
use App\Models\BalanceEntry;
use Illuminate\Http\JsonResponse;

class BalanceEntryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(BalanceEntry::latest('date')->latest('id')->get());
    }

    public function store(StoreBalanceEntryRequest $request): JsonResponse
    {
        return response()->json(BalanceEntry::create($request->validated()), 201);
    }

    public function update(UpdateBalanceEntryRequest $request, BalanceEntry $balanceEntry): JsonResponse
    {
        if ($balanceEntry->transaction_id) return $this->ownedByTransaction();
        $balanceEntry->update($request->validated());
        return response()->json($balanceEntry->fresh());
    }

    public function destroy(BalanceEntry $balanceEntry): JsonResponse
    {
        if ($balanceEntry->transaction_id) return $this->ownedByTransaction();
        $balanceEntry->delete();
        return response()->json(['message' => 'Entry deleted.']);
    }

    /** Entries created by a daily transaction follow that transaction; change them from Transactions. */
    private function ownedByTransaction(): JsonResponse
    {
        return response()->json(['message' => 'This entry comes from a daily transaction — edit or delete it in Transactions.'], 422);
    }
}
