<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\BusinessTransaction;
use App\Models\BalanceEntry;
use App\Models\Gold;
use App\Models\RucoyAccount;
use App\Models\Saving;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;

class MasterDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $now = now();

        // Overall Profit = Business archived profit (all types) + Daily net
        $allArchived         = BusinessTransaction::whereNotNull('archived_at')->get();
        $businessIncome      = (float) $allArchived->whereNotIn('type', ['expense'])->sum('price_php');
        $businessExpense     = (float) $allArchived->whereNotIn('type', ['expense'])->sum('cost_php')
                             + (float) $allArchived->where('type', 'expense')->sum('amount');
        $businessProfit      = $businessIncome - $businessExpense;
        $dailyIncome         = (float) Transaction::where('type', 'income')->sum('amount');
        $dailyExpense        = (float) Transaction::where('type', 'expense')->sum('amount');
        $overallProfit       = $businessProfit + ($dailyIncome - $dailyExpense);

        // Monthly Profit (current month only)
        $monthlyArchived         = BusinessTransaction::whereNotNull('archived_at')
            ->whereYear('archived_at', $now->year)->whereMonth('archived_at', $now->month)->get();
        $monthlyBusinessIncome   = (float) $monthlyArchived->whereNotIn('type', ['expense'])->sum('price_php');
        $monthlyBusinessExpense  = (float) $monthlyArchived->whereNotIn('type', ['expense'])->sum('cost_php')
                                 + (float) $monthlyArchived->where('type', 'expense')->sum('amount');
        $monthlyBusinessProfit   = $monthlyBusinessIncome - $monthlyBusinessExpense;
        $monthlyDailyIncome  = (float) Transaction::where('type', 'income')
            ->whereYear('date', $now->year)->whereMonth('date', $now->month)->sum('amount');
        $monthlyDailyExpense = (float) Transaction::where('type', 'expense')
            ->whereYear('date', $now->year)->whereMonth('date', $now->month)->sum('amount');
        $monthlyProfit = $monthlyBusinessProfit + ($monthlyDailyIncome - $monthlyDailyExpense);

        // Rucoy
        $manualGold = (float) Gold::sum('amount');
        $totalPrice = (float) RucoyAccount::whereNull('archived_at')->sum('cost');

        // Savings
        $savingsDeposit  = (float) Saving::where('type', 'deposit')->sum('amount');
        $savingsWithdraw = (float) Saving::where('type', 'withdraw')->sum('amount');
        $savingsBalance  = $savingsDeposit - $savingsWithdraw;

        // Balance (USD)
        $balanceAdd   = (float) BalanceEntry::where('type', 'add')->sum('amount');
        $balanceSell  = (float) BalanceEntry::where('type', 'sell')->sum('amount');
        $balanceTotal = $balanceAdd - $balanceSell;

        return response()->json([
            'overall_profit'   => $overallProfit,
            'monthly_profit'   => $monthlyProfit,
            'gold_stash'       => $manualGold,
            'total_price'      => $totalPrice,
            'savings_balance'  => $savingsBalance,
            'balance_total'    => $balanceTotal,
        ]);
    }
}
