<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BusinessTransaction;
use App\Models\Transaction;
use App\Services\BusinessProfit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ReportController extends Controller
{
    /** Day ranges of the five "weeks" in a month; the last one is cut to the month's length. */
    private const WEEKS = [[1, 7], [8, 14], [15, 21], [22, 28], [29, 31]];

    public function dailyExpenses(Request $request): JsonResponse
    {
        $period = $request->input('period', 'monthly');
        $year   = $request->integer('year', now()->year);
        $month  = $request->integer('month', now()->month);
        $userId = auth()->id();

        $txns   = Transaction::personal()->where('user_id', $userId);
        $totals = fn (Collection $slice) => $this->dailyTotals($slice);

        $rows = match ($period) {
            'weekly' => $this->weeklyRows($txns->whereYear('date', $year)->whereMonth('date', $month)->get(), 'date', $year, $month, $totals),
            'yearly' => $this->yearlyRows($txns->orderBy('date')->get(), 'date', $totals),
            default  => $this->monthlyRows($txns->whereYear('date', $year)->get(), 'date', $year, $totals),
        };

        $totals = [
            'income'  => round(collect($rows)->sum('income'), 2),
            'expense' => round(collect($rows)->sum('expense'), 2),
            'net'     => round(collect($rows)->sum('net'), 2),
        ];

        // Category breakdown for the same range (Personal only, like the rows)
        $range = Transaction::personal()->where('transactions.user_id', $userId)
            ->join('categories', 'categories.id', '=', 'transactions.category_id');
        if ($period === 'weekly') {
            $range->whereYear('date', $year)->whereMonth('date', $month);
        } elseif ($period === 'monthly') {
            $range->whereYear('date', $year);
        }
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
        $year   = $request->integer('year', now()->year);
        $month  = $request->integer('month', now()->month);

        // A sale counts in the period it was sold (archived)
        $sold    = BusinessTransaction::archived();
        $realize = fn (Collection $slice) => BusinessProfit::realized($slice);

        $rows = match ($period) {
            'weekly' => $this->weeklyRows($sold->whereYear('archived_at', $year)->whereMonth('archived_at', $month)->get(), 'archived_at', $year, $month, $realize),
            'yearly' => $this->yearlyRows($sold->orderBy('archived_at')->get(), 'archived_at', $realize),
            default  => $this->monthlyRows($sold->whereYear('archived_at', $year)->get(), 'archived_at', $year, $realize),
        };

        $totals = [
            'income'  => round(collect($rows)->sum('income'), 2),
            'expense' => round(collect($rows)->sum('expense'), 2),
            'profit'  => round(collect($rows)->sum('profit'), 2),
        ];

        // Breakdown by type (account / gold / item) for the same range, by month sold
        $range = BusinessTransaction::archived();
        if ($period === 'weekly') {
            $range->whereYear('archived_at', $year)->whereMonth('archived_at', $month);
        } elseif ($period === 'monthly') {
            $range->whereYear('archived_at', $year);
        }
        $types = $range->get()->groupBy('type')->map(fn ($g, $type) => [
            'type'  => $type,
            'count' => $g->count(),
            ...array_map(fn ($v) => round($v, 2), BusinessProfit::realized($g)),
        ])->sortByDesc('profit')->values();

        return response()->json(compact('period', 'year', 'month', 'rows', 'totals', 'types'));
    }

    /** @return array{income: float, expense: float, net: float} */
    private function dailyTotals(Collection $slice): array
    {
        $income  = (float) $slice->where('type', 'income')->sum('amount');
        $expense = (float) $slice->where('type', 'expense')->sum('amount');

        return ['income' => $income, 'expense' => $expense, 'net' => $income - $expense];
    }

    // ── Period rows: one labelled row of totals per week / month / year ─────────

    private function weeklyRows(Collection $items, string $dateField, int $year, int $month, callable $totals): array
    {
        $start       = Carbon::createFromDate($year, $month, 1);
        $daysInMonth = $start->daysInMonth;
        $monthName   = $start->format('M');
        $rows        = [];

        foreach (self::WEEKS as $i => [$from, $to]) {
            if ($from > $daysInMonth) {
                break;
            }
            $actualTo = min($to, $daysInMonth);
            $slice    = $items->filter(fn ($t) => Carbon::parse($t->{$dateField})->day >= $from && Carbon::parse($t->{$dateField})->day <= $actualTo);
            $rows[]   = [
                'label' => 'Week ' . ($i + 1) . " ({$monthName} {$from}–{$actualTo})",
                ...$totals($slice),
            ];
        }

        return $rows;
    }

    private function monthlyRows(Collection $items, string $dateField, int $year, callable $totals): array
    {
        $rows = [];

        for ($m = 1; $m <= 12; $m++) {
            $slice  = $items->filter(fn ($t) => Carbon::parse($t->{$dateField})->month === $m);
            $rows[] = [
                'label' => Carbon::createFromDate($year, $m, 1)->format('F Y'),
                ...$totals($slice),
            ];
        }

        return $rows;
    }

    private function yearlyRows(Collection $items, string $dateField, callable $totals): array
    {
        $years = $items->map(fn ($t) => Carbon::parse($t->{$dateField})->year)->unique()->sort()->values();
        $rows  = [];

        foreach ($years as $year) {
            $slice  = $items->filter(fn ($t) => Carbon::parse($t->{$dateField})->year === $year);
            $rows[] = [
                'label' => (string) $year,
                ...$totals($slice),
            ];
        }

        return $rows;
    }
}
