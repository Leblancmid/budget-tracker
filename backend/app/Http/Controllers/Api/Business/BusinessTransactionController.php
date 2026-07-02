<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\StoreBusinessTransactionRequest;
use App\Http\Requests\Business\UpdateBusinessTransactionRequest;
use App\Models\BusinessTransaction;
use Illuminate\Http\JsonResponse;

class BusinessTransactionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            BusinessTransaction::latest('date')->latest('id')->get()
        );
    }

    public function store(StoreBusinessTransactionRequest $request): JsonResponse
    {
        $tx = BusinessTransaction::create($request->validated());

        return response()->json($tx, 201);
    }

    public function update(UpdateBusinessTransactionRequest $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        $businessTransaction->update($request->validated());

        return response()->json($businessTransaction->fresh());
    }

    public function destroy(BusinessTransaction $businessTransaction): JsonResponse
    {
        $businessTransaction->delete();

        return response()->json(['message' => 'Transaction deleted.']);
    }
}
