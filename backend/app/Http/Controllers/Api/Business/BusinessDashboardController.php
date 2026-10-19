<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Models\BusinessTransaction;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BusinessDashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year', now()->year);

        // ── Realized (sold) results — a sale counts in the month it was sold ──
        $soldThisMonth = $this->soldIn($year, $month);
        $realized      = $this->realize($soldThisMonth);

        $prev          = now()->setDate($year, $month, 1)->subMonth();
        $prevRealized  = $this->realize($this->soldIn($prev->year, $prev->month));

        $profitByType = $soldThisMonth->whereNotIn('type', ['expense'])
            ->groupBy('type')
            ->map(fn (Collection $g, $type) => [
                'type'   => $type,
                'count'  => $g->count(),
                'income' => round((float) $g->sum('price_php'), 2),
                'total'  => round((float) $g->sum('price_php') - (float) $g->sum('cost_php'), 2),
            ])
            ->sortByDesc('total')->values();

        $recentSold = $soldThisMonth->sortByDesc('archived_at')->take(6)->values();

        // Realized trend for the year, by month sold
        $soldThisYear = BusinessTransaction::whereNotNull('archived_at')->whereYear('archived_at', $year)->get();
        $realizedTrend = collect(range(1, 12))->map(function ($m) use ($soldThisYear) {
            $r = $this->realize($soldThisYear->filter(fn ($t) => (int) $t->archived_at->month === $m));
            return ['month' => $m, ...$r];
        })->values();

        // ── Pipeline: unsold accounts + gold trades ──
        $open = BusinessTransaction::whereNull('archived_at')->whereIn('type', ['account', 'gold'])->get();
        $priced = $open->whereNotNull('price_php');
        $pipeline = [
            'count'            => $open->count(),
            'awaiting_pricing' => $open->whereNull('price_php')->count(),
            'income'           => round((float) $priced->sum('price_php'), 2),
            'cost'             => round((float) $priced->sum('cost_php'), 2),
            'profit'           => round((float) $priced->sum('price_php') - (float) $priced->sum('cost_php'), 2),
            'by_type'          => $open->groupBy('type')->map(fn ($g, $t) => ['type' => $t, 'count' => $g->count()])->values(),
        ];

        // ── Business-tagged daily transactions (from Transactions, not in Daily Expenses) ──
        $dailyBiz = Transaction::where('user_id', auth()->id())
            ->where('scope', 'business')
            ->whereMonth('date', $month)->whereYear('date', $year)
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'income' THEN amount END), 0) as income, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount END), 0) as expense, COUNT(*) as count")
            ->first();

        // ── Kept for older clients ──
        $base = BusinessTransaction::whereMonth('date', $month)->whereYear('date', $year);
        $recentTransactions = BusinessTransaction::latest('date')->latest('id')->limit(5)->get();
        $expenseByType = BusinessTransaction::select('type', DB::raw('SUM(cost_php) as total'))
            ->whereMonth('date', $month)->whereYear('date', $year)->whereNotNull('cost_php')
            ->groupBy('type')->orderByDesc('total')->get();

        return response()->json([
            'total_income'        => (float) (clone $base)->sum('price_php'),
            'total_expense'       => (float) (clone $base)->sum('cost_php'),
            'total_profit'        => $realized['profit'],
            'archived_income'     => $realized['income'],
            'archived_expense'    => $realized['expense'],
            'sold_count'          => $realized['count'],
            'prev_profit'         => $prevRealized['profit'],
            'prev_count'          => $prevRealized['count'],
            'initial_profit'      => (float) (clone $base)->sum('price_php') - (float) (clone $base)->sum('cost_php'),
            'recent_transactions' => $recentTransactions,
            'recent_sold'         => $recentSold,
            'expense_by_type'     => $expenseByType,
            'profit_by_type'      => $profitByType,
            'realized_trend'      => $realizedTrend,
            'pipeline'            => $pipeline,
            'daily_business'      => [
                'income'  => (float) $dailyBiz->income,
                'expense' => (float) $dailyBiz->expense,
                'count'   => (int) $dailyBiz->count,
            ],
            // Legacy shape (now realized/sold-based, matching the profit above)
            'monthly_trend'       => $realizedTrend->flatMap(fn ($t) => $t['count'] > 0 ? [
                ['month' => $t['month'], 'year' => $year, 'type' => 'income',  'total' => (string) $t['income']],
                ['month' => $t['month'], 'year' => $year, 'type' => 'expense', 'total' => (string) $t['expense']],
            ] : [])->values(),
        ]);
    }

    private function soldIn(int $year, int $month): Collection
    {
        return BusinessTransaction::whereNotNull('archived_at')
            ->whereYear('archived_at', $year)->whereMonth('archived_at', $month)
            ->get();
    }

    /** Same rule as the Sales page "Sold Profit": price − cost for sales, plus item expenses. */
    private function realize(Collection $sold): array
    {
        $income  = (float) $sold->whereNotIn('type', ['expense'])->sum('price_php');
        $expense = (float) $sold->whereNotIn('type', ['expense'])->sum('cost_php')
                 + (float) $sold->where('type', 'expense')->sum('amount');
        return [
            'income'  => round($income, 2),
            'expense' => round($expense, 2),
            'profit'  => round($income - $expense, 2),
            'count'   => $sold->count(),
        ];
    }
}
