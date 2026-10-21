<?php

namespace App\Services;

use Illuminate\Support\Collection;

class BusinessProfit
{
    /**
     * Realized results for a set of sold business transactions (the Sales page "Sold Profit"):
     * price − cost for sales, plus item expenses. Values are not rounded.
     *
     * @return array{income: float, expense: float, profit: float}
     */
    public static function realized(Collection $sold): array
    {
        $income  = (float) $sold->whereNotIn('type', ['expense'])->sum('price_php');
        $expense = (float) $sold->whereNotIn('type', ['expense'])->sum('cost_php')
                 + (float) $sold->where('type', 'expense')->sum('amount');

        return ['income' => $income, 'expense' => $expense, 'profit' => $income - $expense];
    }
}
