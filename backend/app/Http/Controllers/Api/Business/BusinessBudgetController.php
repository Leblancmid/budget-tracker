<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\StoreBusinessBudgetRequest;
use App\Http\Requests\Business\UpdateBusinessBudgetRequest;
use App\Models\BusinessBudget;
use App\Models\BusinessTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessBudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year',  now()->year);

        $budgets = BusinessBudget::with('category')
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->map(function ($b) use ($month, $year) {
                $spent = (float) BusinessTransaction::expense()
                    ->where('category_id', $b->category_id)
                    ->whereMonth('date', $month)
                    ->whereYear('date', $year)
                    ->sum('amount');

                $b->spent      = $spent;
                $b->remaining  = max(0, (float) $b->amount - $spent);
                $b->percentage = $b->amount > 0 ? round(($spent / (float) $b->amount) * 100, 1) : 0;

                return $b;
            });

        return response()->json($budgets);
    }

    public function store(StoreBusinessBudgetRequest $request): JsonResponse
    {
        $data   = $request->validated();
        $budget = BusinessBudget::updateOrCreate(
            ['category_id' => $data['category_id'], 'month' => $data['month'], 'year' => $data['year']],
            ['amount' => $data['amount']]
        );

        return response()->json($budget->load('category'), 201);
    }

    public function update(UpdateBusinessBudgetRequest $request, BusinessBudget $businessBudget): JsonResponse
    {
        $businessBudget->update($request->validated());

        return response()->json($businessBudget->fresh()->load('category'));
    }

    public function destroy(BusinessBudget $businessBudget): JsonResponse
    {
        $businessBudget->delete();

        return response()->json(['message' => 'Budget deleted.']);
    }
}
