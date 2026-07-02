<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreSavingRequest;
use App\Http\Requests\Master\UpdateSavingRequest;
use App\Models\Saving;
use Illuminate\Http\JsonResponse;

class SavingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Saving::latest('date')->latest('id')->get());
    }

    public function store(StoreSavingRequest $request): JsonResponse
    {
        return response()->json(Saving::create($request->validated()), 201);
    }

    public function update(UpdateSavingRequest $request, Saving $saving): JsonResponse
    {
        $saving->update($request->validated());

        return response()->json($saving->fresh());
    }

    public function destroy(Saving $saving): JsonResponse
    {
        $saving->delete();

        return response()->json(['message' => 'Saving deleted.']);
    }
}
