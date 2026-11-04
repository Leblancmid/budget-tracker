<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year', now()->year);

        // Totals count Personal transactions only, matching the Daily Expenses dashboard
        $inMonth = fn ($q) => $q->personal()->whereMonth('date', $month)->whereYear('date', $year);

        // Largest single transaction per category this month (latest one wins a tie)
        $monthHighest = Transaction::personal()
            ->where('user_id', auth()->id())
            ->whereMonth('date', $month)->whereYear('date', $year)
            ->orderByDesc('amount')->orderByDesc('date')->orderByDesc('id')
            ->get(['category_id', 'amount', 'description', 'date'])
            ->unique('category_id')
            ->keyBy('category_id');

        $categories = Category::withCount('transactions')
            ->withSum(['transactions as month_total' => $inMonth], 'amount')
            ->withSum(['transactions as all_time_total' => fn ($q) => $q->personal()], 'amount')
            ->withMax(['transactions as all_time_highest' => fn ($q) => $q->personal()->where('user_id', auth()->id())], 'amount')
            ->where('user_id', auth()->id())
            ->orderBy('type')
            ->orderBy('name')
            ->get()
            ->each(function ($c) use ($monthHighest) {
                $c->month_total      = (float) ($c->month_total ?? 0);
                $c->all_time_total   = (float) ($c->all_time_total ?? 0);
                $c->all_time_highest = $c->all_time_highest !== null ? (float) $c->all_time_highest : null;

                $top = $monthHighest->get($c->id);
                $c->month_highest = $top ? [
                    'amount'      => (float) $top->amount,
                    'description' => $top->description,
                    'date'        => $top->date->format('Y-m-d'),
                ] : null;
            });

        return response()->json($categories);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create(array_merge($request->validated(), ['user_id' => auth()->id()]));

        return response()->json($category, 201);
    }

    public function show(Category $category): JsonResponse
    {
        Gate::authorize('view', $category);

        return response()->json($category->loadCount('transactions'));
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        Gate::authorize('update', $category);
        $category->update($request->validated());

        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        Gate::authorize('delete', $category);

        if ($category->transactions()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with existing transactions.',
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
