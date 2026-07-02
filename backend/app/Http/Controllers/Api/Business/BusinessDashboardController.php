<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Models\BusinessTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusinessDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year', now()->year);

        $income = (float) BusinessTransaction::whereIn('type', ['account', 'gold'])
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $expense = (float) BusinessTransaction::where('type', 'expense')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $recentTransactions = BusinessTransaction::with('category')
            ->latest('date')
            ->latest('id')
            ->limit(5)
            ->get();

        $expenseByCategory = BusinessTransaction::select('category_id', DB::raw('SUM(amount) as total'))
            ->with('category:id,name,color,icon')
            ->where('type', 'expense')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->limit(6)
            ->get();

        $monthlyTrend = BusinessTransaction::select(
                DB::raw('MONTH(date) as month'),
                DB::raw('YEAR(date) as year'),
                DB::raw("CASE WHEN type = 'expense' THEN 'expense' ELSE 'income' END as type"),
                DB::raw('SUM(amount) as total')
            )
            ->whereYear('date', $year)
            ->groupBy('year', 'month', DB::raw("CASE WHEN type = 'expense' THEN 'expense' ELSE 'income' END"))
            ->orderBy('month')
            ->get();

        return response()->json([
            'total_income'        => $income,
            'total_expense'       => $expense,
            'total_profit'        => $income - $expense,
            'balance'             => $income - $expense,
            'recent_transactions' => $recentTransactions,
            'expense_by_category' => $expenseByCategory,
            'monthly_trend'       => $monthlyTrend,
        ]);
    }
}
