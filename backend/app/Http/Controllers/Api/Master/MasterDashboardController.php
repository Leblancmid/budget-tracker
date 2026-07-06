<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\RucoyAccount;
use App\Models\Saving;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;

class MasterDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // Overall Profit = Business archived profit + Daily (income - expense)
        $businessProfit = (float) BusinessTransaction::where('type', 'account')
            ->whereNotNull('archived_at')
            ->sum('profit_php');
        $dailyIncome    = (float) Transaction::where('type', 'income')->sum('amount');
        $dailyExpense   = (float) Transaction::where('type', 'expense')->sum('amount');
        $overallProfit  = $businessProfit + ($dailyIncome - $dailyExpense);

        // Rucoy
        $manualGold = (float) Gold::sum('amount');
        $totalPrice = (float) RucoyAccount::whereNull('archived_at')->sum('cost');

        // Savings
        $savingsDeposit  = (float) Saving::where('type', 'deposit')->sum('amount');
        $savingsWithdraw = (float) Saving::where('type', 'withdraw')->sum('amount');
        $savingsBalance  = $savingsDeposit - $savingsWithdraw;

        return response()->json([
            'overall_profit'   => $overallProfit,
            'gold_stash'       => $manualGold,
            'total_price'      => $totalPrice,
            'savings_balance'  => $savingsBalance,
        ]);
    }
}
