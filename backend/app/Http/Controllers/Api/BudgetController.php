<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBudgetRequest;
use App\Http\Requests\UpdateBudgetRequest;
use App\Models\Budget;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year', now()->year);

        $budgets = Budget::with('category')
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->map(function (Budget $budget) use ($month, $year) {
                $spent = Transaction::where('category_id', $budget->category_id)
                    ->where('type', 'expense')
                    ->whereMonth('date', $month)
                    ->whereYear('date', $year)
                    ->sum('amount');

                $budget->spent   = (float) $spent;
                $budget->remaining = max(0, (float) $budget->amount - (float) $spent);
                $budget->percentage = $budget->amount > 0
                    ? round(((float) $spent / (float) $budget->amount) * 100, 1)
                    : 0;

                return $budget;
            });

        return response()->json($budgets);
    }

    public function store(StoreBudgetRequest $request): JsonResponse
    {
        $budget = Budget::create($request->validated());

        return response()->json($budget->load('category'), 201);
    }

    public function update(UpdateBudgetRequest $request, Budget $budget): JsonResponse
    {
        $budget->update($request->validated());

        return response()->json($budget->load('category'));
    }

    public function destroy(Budget $budget): JsonResponse
    {
        $budget->delete();

        return response()->json(['message' => 'Budget deleted successfully.']);
    }
}
