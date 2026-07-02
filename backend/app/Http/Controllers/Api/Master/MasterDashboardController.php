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
        // Business
        $businessIncome  = (float) BusinessTransaction::whereIn('type', ['account', 'gold'])->sum('amount');
        $businessExpense = (float) BusinessTransaction::where('type', 'expense')->sum('amount');
        $businessProfit  = $businessIncome - $businessExpense;

        // Daily Expenses
        $dailyIncome  = (float) Transaction::where('type', 'income')->sum('amount');
        $dailyExpense = (float) Transaction::where('type', 'expense')->sum('amount');
        $dailyBalance = $dailyIncome - $dailyExpense;

        // Rucoy
        $manualGold = (float) Gold::sum('amount');
        $totalPrice = (float) RucoyAccount::whereNull('archived_at')->sum('cost');

        // Savings
        $savingsDeposit  = (float) Saving::where('type', 'deposit')->sum('amount');
        $savingsWithdraw = (float) Saving::where('type', 'withdraw')->sum('amount');
        $savingsBalance  = $savingsDeposit - $savingsWithdraw;

        return response()->json([
            'overall_profit'  => $businessProfit + $dailyBalance,
            'overall_balance' => $businessProfit + $dailyBalance,
            'gold_stash'      => $manualGold,
            'total_price'     => $totalPrice,
            'savings_balance' => $savingsBalance,
        ]);
    }
}
