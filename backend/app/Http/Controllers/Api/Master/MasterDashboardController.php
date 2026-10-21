<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\RucoyAccount;
use App\Models\Trade;
use App\Models\Transaction;
use App\Services\BusinessProfit;
use Illuminate\Http\JsonResponse;

class MasterDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $now = now();

        // Overall Profit = Business archived profit (all types) + Daily net
        $businessProfit = BusinessProfit::realized(BusinessTransaction::archived()->get())['profit'];
        $dailyIncome    = (float) Transaction::personal()->where('type', 'income')->sum('amount');
        $dailyExpense   = (float) Transaction::personal()->where('type', 'expense')->sum('amount');
        $overallProfit  = $businessProfit + ($dailyIncome - $dailyExpense);

        // Monthly Profit (current month only)
        $monthlyBusinessProfit = BusinessProfit::realized(
            BusinessTransaction::archived()->whereYear('archived_at', $now->year)->whereMonth('archived_at', $now->month)->get()
        )['profit'];
        $monthlyDailyIncome = (float) Transaction::personal()->where('type', 'income')
            ->whereYear('date', $now->year)->whereMonth('date', $now->month)->sum('amount');
        $monthlyDailyExpense = (float) Transaction::personal()->where('type', 'expense')
            ->whereYear('date', $now->year)->whereMonth('date', $now->month)->sum('amount');
        $monthlyProfit = $monthlyBusinessProfit + ($monthlyDailyIncome - $monthlyDailyExpense);

        // Rucoy
        $manualGold = (float) Gold::sum('amount');
        $totalPrice = (float) RucoyAccount::active()->sum('cost');

        // Balance — split USD vs PHP accounts
        $usdAccounts = BalanceAccount::codesFor('USD');
        $phpAccounts = BalanceAccount::codesFor('PHP');

        return response()->json([
            'overall_profit'    => $overallProfit,
            'monthly_profit'    => $monthlyProfit,
            'gold_stash'        => $manualGold,
            'total_price'       => $totalPrice,
            'balance_usd_total' => $this->balanceOf($usdAccounts),
            'balance_php_total' => $this->balanceOf($phpAccounts),
            // Breakdowns behind the profit figures above
            'business_profit'         => round($businessProfit, 2),
            'daily_net'               => round($dailyIncome - $dailyExpense, 2),
            'monthly_business_profit' => round($monthlyBusinessProfit, 2),
            'monthly_daily_net'       => round($monthlyDailyIncome - $monthlyDailyExpense, 2),
            'kks_gold'                => (float) Trade::where('status', 'kks')->active()->sum('amount'),
            'account_count'           => RucoyAccount::active()->count(),
            'balance_usd_accounts'    => count($usdAccounts),
            'balance_php_accounts'    => count($phpAccounts),
        ]);
    }

    /** Money added minus money taken out across the given balance accounts. */
    private function balanceOf(array $accounts): float
    {
        return (float) BalanceEntry::whereIn('account', $accounts)->where('type', 'add')->sum('amount')
             - (float) BalanceEntry::whereIn('account', $accounts)->where('type', 'sell')->sum('amount');
    }
}
