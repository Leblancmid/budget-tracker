<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRucoyAccountRequest;
use App\Http\Requests\UpdateRucoyAccountRequest;
use App\Models\RucoyAccount;
use Illuminate\Http\JsonResponse;

class RucoyAccountController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(RucoyAccount::latest()->get());
    }

    public function store(StoreRucoyAccountRequest $request): JsonResponse
    {
        return response()->json(RucoyAccount::create($request->validated()), 201);
    }

    public function update(UpdateRucoyAccountRequest $request, RucoyAccount $rucoyAccount): JsonResponse
    {
        $rucoyAccount->update($request->validated());

        return response()->json($rucoyAccount);
    }

    public function destroy(RucoyAccount $rucoyAccount): JsonResponse
    {
        $rucoyAccount->delete();

        return response()->json(['message' => 'Account deleted.']);
    }
}
