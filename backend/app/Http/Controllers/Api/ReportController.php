<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessTransaction;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReportController extends Controller
{
    public function dailyExpenses(Request $request): JsonResponse
    {
        $period = $request->input('period', 'monthly');
        $year   = (int) $request->input('year', now()->year);
        $month  = (int) $request->input('month', now()->month);
        $userId = auth()->id();

        $rows = match ($period) {
            'weekly' => $this->dailyWeekly($year, $month, $userId),
            'yearly' => $this->dailyYearly($userId),
            default  => $this->dailyMonthly($year, $userId),
        };

        $totals = [
            'income'  => round(collect($rows)->sum('income'), 2),
            'expense' => round(collect($rows)->sum('expense'), 2),
            'net'     => round(collect($rows)->sum('net'), 2),
        ];

        // Category breakdown for the same range (Personal only, like the rows)
        $range = Transaction::personal()->where('transactions.user_id', $userId)
            ->join('categories', 'categories.id', '=', 'transactions.category_id');
        if ($period === 'weekly')      $range->whereYear('date', $year)->whereMonth('date', $month);
        elseif ($period === 'monthly') $range->whereYear('date', $year);
        $categories = $range
            ->selectRaw('categories.id, categories.name, categories.color, categories.icon, transactions.type, SUM(transactions.amount) as total, COUNT(*) as count')
            ->groupBy('categories.id', 'categories.name', 'categories.color', 'categories.icon', 'transactions.type')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($c) => [...$c->toArray(), 'total' => round((float) $c->total, 2), 'count' => (int) $c->count]);

        return response()->json(compact('period', 'year', 'month', 'rows', 'totals', 'categories'));
    }

    public function business(Request $request): JsonResponse
    {
        $period = $request->input('period', 'monthly');
        $year   = (int) $request->input('year', now()->year);
        $month  = (int) $request->input('month', now()->month);

        $rows = match ($period) {
            'weekly' => $this->businessWeekly($year, $month),
            'yearly' => $this->businessYearly(),
            default  => $this->businessMonthly($year),
        };

        $totals = [
            'income'  => round(collect($rows)->sum('income'), 2),
            'expense' => round(collect($rows)->sum('expense'), 2),
            'profit'  => round(collect($rows)->sum('profit'), 2),
        ];

        // Breakdown by type (account / gold / item) for the same range, by month sold
        $sold = BusinessTransaction::whereNotNull('archived_at');
        if ($period === 'weekly')      $sold->whereYear('archived_at', $year)->whereMonth('archived_at', $month);
        elseif ($period === 'monthly') $sold->whereYear('archived_at', $year);
        $types = $sold->get()->groupBy('type')->map(fn ($g, $type) => [
            'type'  => $type,
            'count' => $g->count(),
            ...array_map(fn ($v) => round($v, 2), $this->businessTotals($g)),
        ])->sortByDesc('profit')->values();

        return response()->json(compact('period', 'year', 'month', 'rows', 'totals', 'types'));
    }

    // ── Daily Expenses ────────────────────────────────────────────────────────

    private function dailyWeekly(int $year, int $month, int $userId): array
    {
        $txns        = Transaction::personal()->where('user_id', $userId)->whereYear('date', $year)->whereMonth('date', $month)->get();
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        $monthName   = Carbon::createFromDate($year, $month, 1)->format('M');
        $rows        = [];

        foreach ([[1, 7], [8, 14], [15, 21], [22, 28], [29, $daysInMonth]] as $i => [$from, $to]) {
            if ($from > $daysInMonth) break;
            $actualTo = min($to, $daysInMonth);
            $slice    = $txns->filter(fn($t) => Carbon::parse($t->date)->day >= $from && Carbon::parse($t->date)->day <= $actualTo);
            $income   = (float) $slice->where('type', 'income')->sum('amount');
            $expense  = (float) $slice->where('type', 'expense')->sum('amount');
            $rows[]   = [
                'label'   => 'Week ' . ($i + 1) . " ({$monthName} {$from}–{$actualTo})",
                'income'  => $income,
                'expense' => $expense,
                'net'     => $income - $expense,
            ];
        }

        return $rows;
    }

    private function dailyMonthly(int $year, int $userId): array
    {
        $txns = Transaction::personal()->where('user_id', $userId)->whereYear('date', $year)->get();
        $rows = [];

        for ($m = 1; $m <= 12; $m++) {
            $slice   = $txns->filter(fn($t) => Carbon::parse($t->date)->month === $m);
            $income  = (float) $slice->where('type', 'income')->sum('amount');
            $expense = (float) $slice->where('type', 'expense')->sum('amount');
            $rows[]  = [
                'label'   => Carbon::createFromDate($year, $m, 1)->format('F Y'),
                'income'  => $income,
                'expense' => $expense,
                'net'     => $income - $expense,
            ];
        }

        return $rows;
    }

    private function dailyYearly(int $userId): array
    {
        $txns  = Transaction::personal()->where('user_id', $userId)->orderBy('date')->get();
        $years = $txns->map(fn($t) => Carbon::parse($t->date)->year)->unique()->sort()->values();
        $rows  = [];

        foreach ($years as $year) {
            $slice   = $txns->filter(fn($t) => Carbon::parse($t->date)->year === $year);
            $income  = (float) $slice->where('type', 'income')->sum('amount');
            $expense = (float) $slice->where('type', 'expense')->sum('amount');
            $rows[]  = [
                'label'   => (string) $year,
                'income'  => $income,
                'expense' => $expense,
                'net'     => $income - $expense,
            ];
        }

        return $rows;
    }

    // ── Business ──────────────────────────────────────────────────────────────

    private function businessTotals($slice): array
    {
        $income  = (float) $slice->whereNotIn('type', ['expense'])->sum('price_php');
        $expense = (float) $slice->whereNotIn('type', ['expense'])->sum('cost_php')
                 + (float) $slice->where('type', 'expense')->sum('amount');
        return ['income' => $income, 'expense' => $expense, 'profit' => $income - $expense];
    }

    private function businessWeekly(int $year, int $month): array
    {
        $txns        = BusinessTransaction::whereNotNull('archived_at')->whereYear('archived_at', $year)->whereMonth('archived_at', $month)->get();
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        $monthName   = Carbon::createFromDate($year, $month, 1)->format('M');
        $rows        = [];

        foreach ([[1, 7], [8, 14], [15, 21], [22, 28], [29, $daysInMonth]] as $i => [$from, $to]) {
            if ($from > $daysInMonth) break;
            $actualTo = min($to, $daysInMonth);
            $slice    = $txns->filter(fn($t) => Carbon::parse($t->archived_at)->day >= $from && Carbon::parse($t->archived_at)->day <= $actualTo);
            $rows[]   = array_merge(
                ['label' => 'Week ' . ($i + 1) . " ({$monthName} {$from}–{$actualTo})"],
                $this->businessTotals($slice),
            );
        }

        return $rows;
    }

    private function businessMonthly(int $year): array
    {
        $txns = BusinessTransaction::whereNotNull('archived_at')->whereYear('archived_at', $year)->get();
        $rows = [];

        for ($m = 1; $m <= 12; $m++) {
            $slice  = $txns->filter(fn($t) => Carbon::parse($t->archived_at)->month === $m);
            $rows[] = array_merge(
                ['label' => Carbon::createFromDate($year, $m, 1)->format('F Y')],
                $this->businessTotals($slice),
            );
        }

        return $rows;
    }

    private function businessYearly(): array
    {
        $txns  = BusinessTransaction::whereNotNull('archived_at')->orderBy('archived_at')->get();
        $years = $txns->map(fn($t) => Carbon::parse($t->archived_at)->year)->unique()->sort()->values();
        $rows  = [];

        foreach ($years as $year) {
            $slice  = $txns->filter(fn($t) => Carbon::parse($t->archived_at)->year === $year);
            $rows[] = array_merge(
                ['label' => (string) $year],
                $this->businessTotals($slice),
            );
        }

        return $rows;
    }
}