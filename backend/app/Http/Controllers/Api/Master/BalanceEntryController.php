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
        $balanceEntry->update($request->validated());
        return response()->json($balanceEntry->fresh());
    }

    public function destroy(BalanceEntry $balanceEntry): JsonResponse
    {
        $balanceEntry->delete();
        return response()->json(['message' => 'Entry deleted.']);
    }
}
