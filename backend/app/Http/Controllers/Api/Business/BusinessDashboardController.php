<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Models\BusinessTransaction;
use App\Models\Saving;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusinessDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year', now()->year);

        $income = (float) BusinessTransaction::where(function ($q) {
                $q->where('action', 'sell')
                  ->orWhere(function ($q2) {
                      $q2->whereNull('action')->where('type', '!=', 'expense');
                  });
            })
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $expense = (float) BusinessTransaction::where(function ($q) {
                $q->where('action', 'buy')
                  ->orWhere(function ($q2) {
                      $q2->whereNull('action')->where('type', 'expense');
                  });
            })
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $recentTransactions = BusinessTransaction::latest('date')
            ->latest('id')
            ->limit(5)
            ->get();

        $expenseByType = BusinessTransaction::select('type', DB::raw('SUM(amount) as total'))
            ->where(function ($q) {
                $q->where('action', 'buy')
                  ->orWhere(function ($q2) {
                      $q2->whereNull('action')->where('type', 'expense');
                  });
            })
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->groupBy('type')
            ->orderByDesc('total')
            ->get();

        $incomeExpr  = "CASE WHEN action = 'sell' OR (action IS NULL AND type != 'expense') THEN 'income' ELSE 'expense' END";
        $monthlyTrend = BusinessTransaction::select(
                DB::raw('MONTH(date) as month'),
                DB::raw('YEAR(date) as year'),
                DB::raw("$incomeExpr as type"),
                DB::raw('SUM(amount) as total')
            )
            ->whereYear('date', $year)
            ->groupBy('year', 'month', DB::raw($incomeExpr))
            ->orderBy('month')
            ->get();

        $savingsToBusiness = (float) Saving::where('type', 'withdraw')
            ->where('transfer', 'business')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $businessToSavings = (float) Saving::where('type', 'deposit')
            ->where('transfer', 'business')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $profit  = $income - $expense;
        $balance = $profit + $savingsToBusiness - $businessToSavings;

        return response()->json([
            'total_income'        => $income,
            'total_expense'       => $expense,
            'total_profit'        => $profit,
            'balance'             => $balance,
            'recent_transactions' => $recentTransactions,
            'expense_by_type'     => $expenseByType,
            'monthly_trend'       => $monthlyTrend,
        ]);
    }
}
