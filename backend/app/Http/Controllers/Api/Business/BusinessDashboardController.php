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
        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year', now()->year);

        $base = BusinessTransaction::whereMonth('date', $month)->whereYear('date', $year);

        $income  = (float) (clone $base)->sum('price_php');
        $expense = (float) (clone $base)->sum('cost_php');
        $profit  = $income - $expense;

        $recentTransactions = BusinessTransaction::latest('date')
            ->latest('id')
            ->limit(5)
            ->get();

        $expenseByType = BusinessTransaction::select('type', DB::raw('SUM(cost_php) as total'))
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->whereNotNull('cost_php')
            ->groupBy('type')
            ->orderByDesc('total')
            ->get();

        $monthlyTrend = BusinessTransaction::select(
                DB::raw('MONTH(date) as month'),
                DB::raw('YEAR(date) as year'),
                DB::raw("'income' as type"),
                DB::raw('SUM(price_php) as total')
            )
            ->whereYear('date', $year)
            ->whereNotNull('price_php')
            ->groupBy('year', 'month')
            ->orderBy('month')
            ->unionAll(
                BusinessTransaction::select(
                    DB::raw('MONTH(date) as month'),
                    DB::raw('YEAR(date) as year'),
                    DB::raw("'expense' as type"),
                    DB::raw('SUM(cost_php) as total')
                )
                ->whereYear('date', $year)
                ->whereNotNull('cost_php')
                ->groupBy('year', 'month')
                ->orderBy('month')
            )
            ->get();

        return response()->json([
            'total_income'        => $income,
            'total_expense'       => $expense,
            'total_profit'        => $profit,
            'recent_transactions' => $recentTransactions,
            'expense_by_type'     => $expenseByType,
            'monthly_trend'       => $monthlyTrend,
        ]);
    }
}
