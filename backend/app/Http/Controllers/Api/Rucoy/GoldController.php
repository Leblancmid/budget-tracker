<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGoldRequest;
use App\Http\Requests\UpdateGoldRequest;
use App\Models\Gold;
use Illuminate\Http\JsonResponse;

class GoldController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Gold::latest()->get());
    }

    public function store(StoreGoldRequest $request): JsonResponse
    {
        return response()->json(Gold::create($request->validated()), 201);
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
