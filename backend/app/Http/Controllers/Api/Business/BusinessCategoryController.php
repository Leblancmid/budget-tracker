<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Models\BusinessCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessCategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(BusinessCategory::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'required|string|max:100',
            'type'  => 'required|in:account,gold,expense',
            'color' => 'nullable|string|max:7',
            'icon'  => 'nullable|string|max:50',
        ]);

        return response()->json(BusinessCategory::create($data), 201);
    }

    public function update(Request $request, BusinessCategory $businessCategory): JsonResponse
    {
        $data = $request->validate([
            'name'  => 'sometimes|string|max:100',
            'type'  => 'sometimes|in:account,gold,expense',
            'color' => 'nullable|string|max:7',
            'icon'  => 'nullable|string|max:50',
        ]);

        $businessCategory->update($data);

        return response()->json($businessCategory->fresh());
    }

    public function destroy(BusinessCategory $businessCategory): JsonResponse
    {
        $businessCategory->delete();

        return response()->json(['message' => 'Category deleted.']);
    }
}
