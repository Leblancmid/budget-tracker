<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = auth()->id();
        $month  = $request->integer('month', now()->month);
        $year   = $request->integer('year', now()->year);

        $totalIncome = Transaction::where('user_id', $userId)->personal()
            ->where('type', 'income')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $totalExpense = Transaction::where('user_id', $userId)->personal()
            ->where('type', 'expense')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->sum('amount');

        $recentTransactions = Transaction::with('category')
            ->where('user_id', $userId)->personal()
            ->latest('date')
            ->latest('id')
            ->limit(5)
            ->get();

        $expenseByCategory = Transaction::select('category_id', DB::raw('SUM(amount) as total'))
            ->with('category:id,name,color,icon')
            ->where('user_id', $userId)->personal()
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
            ->where('user_id', $userId)->personal()
            ->whereYear('date', $year)
            ->groupBy('year', 'month', 'type')
            ->orderBy('month')
            ->get();

        // Business-tagged daily transactions are tracked separately and left out of the totals above
        $business = Transaction::where('user_id', $userId)
            ->where('scope', 'business')
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) as income, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as expense, COUNT(*) as count")
            ->first();

        return response()->json([
            'total_income'        => (float) $totalIncome,
            'total_expense'       => (float) $totalExpense,
            'business_income'     => (float) $business->income,
            'business_expense'    => (float) $business->expense,
            'business_count'      => (int) $business->count,
            'recent_transactions' => $recentTransactions,
            'expense_by_category' => $expenseByCategory,
            'monthly_trend'       => $monthlyTrend,
        ]);
    }
}
