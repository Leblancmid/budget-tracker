<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBudgetRequest;
use App\Http\Requests\UpdateBudgetRequest;
use App\Models\Budget;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = auth()->id();
        $month  = $request->integer('month', now()->month);
        $year   = $request->integer('year', now()->year);

        $budgets = Budget::with('category')
            ->where('user_id', $userId)
            ->where('month', $month)
            ->where('year', $year)
            ->get()
            ->map(function (Budget $budget) use ($userId, $month, $year) {
                $spent = Transaction::personal()->where('user_id', $userId)
                    ->where('category_id', $budget->category_id)
                    ->where('type', 'expense')
                    ->whereMonth('date', $month)
                    ->whereYear('date', $year)
                    ->sum('amount');

                $budget->spent     = (float) $spent;
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
        $budget = Budget::create(array_merge($request->validated(), ['user_id' => auth()->id()]));

        return response()->json($budget->load('category'), 201);
    }

    public function update(UpdateBudgetRequest $request, Budget $budget): JsonResponse
    {
        Gate::authorize('update', $budget);
        $budget->update($request->validated());

        return response()->json($budget->load('category'));
    }

    public function destroy(Budget $budget): JsonResponse
    {
        Gate::authorize('delete', $budget);
        $budget->delete();

        return response()->json(['message' => 'Budget deleted successfully.']);
    }
}
