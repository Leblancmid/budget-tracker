<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year', now()->year);

        $totalIncome = Transaction::where('type', 'income')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $totalExpense = Transaction::where('type', 'expense')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $recentTransactions = Transaction::with('category')
            ->latest('date')
            ->latest('id')
            ->limit(5)
            ->get();

        $expenseByCategory = Transaction::select('category_id', DB::raw('SUM(amount) as total'))
            ->with('category:id,name,color,icon')
            ->where('type', 'expense')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->limit(6)
            ->get();

        $monthlyTrend = Transaction::select(
                DB::raw('MONTH(date) as month'),
                DB::raw('YEAR(date) as year'),
                'type',
                DB::raw('SUM(amount) as total')
            )
            ->whereYear('date', $year)
            ->groupBy('year', 'month', 'type')
            ->orderBy('month')
            ->get();

        return response()->json([
            'total_income'        => (float) $totalIncome,
            'total_expense'       => (float) $totalExpense,
            'balance'             => (float) $totalIncome - (float) $totalExpense,
            'recent_transactions' => $recentTransactions,
            'expense_by_category' => $expenseByCategory,
            'monthly_trend'       => $monthlyTrend,
        ]);
    }
}
