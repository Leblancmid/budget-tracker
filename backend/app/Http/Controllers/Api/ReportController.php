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

        $rows = match ($period) {
            'weekly' => $this->dailyWeekly($year, $month),
            'yearly' => $this->dailyYearly(),
            default  => $this->dailyMonthly($year),
        };

        $totals = [
            'income'  => round(collect($rows)->sum('income'), 2),
            'expense' => round(collect($rows)->sum('expense'), 2),
            'net'     => round(collect($rows)->sum('net'), 2),
        ];

        return response()->json(compact('period', 'year', 'month', 'rows', 'totals'));
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

        return response()->json(compact('period', 'year', 'month', 'rows', 'totals'));
    }

    // ── Daily Expenses ────────────────────────────────────────────────────────

    private function dailyWeekly(int $year, int $month): array
    {
        $txns        = Transaction::whereYear('date', $year)->whereMonth('date', $month)->get();
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

    private function dailyMonthly(int $year): array
    {
        $txns = Transaction::whereYear('date', $year)->get();
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

    private function dailyYearly(): array
    {
        $txns  = Transaction::orderBy('date')->get();
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
        $txns        = BusinessTransaction::whereYear('date', $year)->whereMonth('date', $month)->get();
        $daysInMonth = Carbon::createFromDate($year, $month, 1)->daysInMonth;
        $monthName   = Carbon::createFromDate($year, $month, 1)->format('M');
        $rows        = [];

        foreach ([[1, 7], [8, 14], [15, 21], [22, 28], [29, $daysInMonth]] as $i => [$from, $to]) {
            if ($from > $daysInMonth) break;
            $actualTo = min($to, $daysInMonth);
            $slice    = $txns->filter(fn($t) => Carbon::parse($t->date)->day >= $from && Carbon::parse($t->date)->day <= $actualTo);
            $rows[]   = array_merge(
                ['label' => 'Week ' . ($i + 1) . " ({$monthName} {$from}–{$actualTo})"],
                $this->businessTotals($slice),
            );
        }

        return $rows;
    }

    private function businessMonthly(int $year): array
    {
        $txns = BusinessTransaction::whereYear('date', $year)->get();
        $rows = [];

        for ($m = 1; $m <= 12; $m++) {
            $slice  = $txns->filter(fn($t) => Carbon::parse($t->date)->month === $m);
            $rows[] = array_merge(
                ['label' => Carbon::createFromDate($year, $m, 1)->format('F Y')],
                $this->businessTotals($slice),
            );
        }

        return $rows;
    }

    private function businessYearly(): array
    {
        $txns  = BusinessTransaction::orderBy('date')->get();
        $years = $txns->map(fn($t) => Carbon::parse($t->date)->year)->unique()->sort()->values();
        $rows  = [];

        foreach ($years as $year) {
            $slice  = $txns->filter(fn($t) => Carbon::parse($t->date)->year === $year);
            $rows[] = array_merge(
                ['label' => (string) $year],
                $this->businessTotals($slice),
            );
        }

        return $rows;
    }
}