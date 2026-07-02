<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Models\BusinessTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessTransactionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            BusinessTransaction::with('category')->latest()->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:business_categories,id',
            'type'        => 'required|in:account,gold,expense',
            'action'      => 'nullable|in:buy,sell',
            'amount'      => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date'        => 'required|date',
            'notes'       => 'nullable|string',
        ]);

        $tx = BusinessTransaction::create($data);

        return response()->json($tx->load('category'), 201);
    }

    public function update(Request $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        $data = $request->validate([
            'category_id' => 'nullable|exists:business_categories,id',
            'type'        => 'sometimes|in:account,gold,expense',
            'action'      => 'nullable|in:buy,sell',
            'amount'      => 'sometimes|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date'        => 'sometimes|date',
            'notes'       => 'nullable|string',
        ]);

        $businessTransaction->update($data);

        return response()->json($businessTransaction->fresh()->load('category'));
    }

    public function destroy(BusinessTransaction $businessTransaction): JsonResponse
    {
        $businessTransaction->delete();

        return response()->json(['message' => 'Transaction deleted.']);
    }
}
