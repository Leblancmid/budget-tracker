<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Saving;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavingController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Saving::latest('date')->latest('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mode_of_payment' => 'required|in:CIMB,MARIBANK,GCASH',
            'type'            => 'required|in:deposit,withdraw',
            'transfer'        => 'nullable|in:daily_expenses,business',
            'description'     => 'nullable|string|max:255',
            'amount'          => 'required|numeric|min:0.01',
            'date'            => 'required|date',
        ]);

        return response()->json(Saving::create($data), 201);
    }

    public function update(Request $request, Saving $saving): JsonResponse
    {
        $data = $request->validate([
            'mode_of_payment' => 'sometimes|in:CIMB,MARIBANK,GCASH',
            'type'            => 'sometimes|in:deposit,withdraw',
            'transfer'        => 'nullable|in:daily_expenses,business',
            'description'     => 'nullable|string|max:255',
            'amount'          => 'sometimes|numeric|min:0.01',
            'date'            => 'sometimes|date',
        ]);

        $saving->update($data);

        return response()->json($saving->fresh());
    }

    public function destroy(Saving $saving): JsonResponse
    {
        $saving->delete();

        return response()->json(['message' => 'Saving deleted.']);
    }
}
