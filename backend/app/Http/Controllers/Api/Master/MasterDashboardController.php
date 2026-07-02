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
        $businessIncome  = (float) BusinessTransaction::where(function ($q) {
            $q->where('action', 'sell')
               ->orWhere(function ($q2) {
                   $q2->whereNull('action')->where('type', '!=', 'expense');
               });
        })->sum('amount');
        $businessExpense = (float) BusinessTransaction::where(function ($q) {
            $q->where('action', 'buy')
               ->orWhere(function ($q2) {
                   $q2->whereNull('action')->where('type', 'expense');
               });
        })->sum('amount');
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

        // Savings ↔ Daily Expenses transfers
        $savingsToDaily = (float) Saving::where('type', 'withdraw')->where('transfer', 'daily_expenses')->sum('amount');
        $dailyToSavings = (float) Saving::where('type', 'deposit')->where('transfer', 'daily_expenses')->sum('amount');

        // Savings ↔ Business transfers
        $savingsToBusiness = (float) Saving::where('type', 'withdraw')->where('transfer', 'business')->sum('amount');
        $businessToSavings = (float) Saving::where('type', 'deposit')->where('transfer', 'business')->sum('amount');

        $adjustedDailyBalance    = $dailyBalance   + $savingsToDaily   - $dailyToSavings;
        $adjustedBusinessBalance = $businessProfit + $savingsToBusiness - $businessToSavings;

        return response()->json([
            'overall_profit'   => $adjustedBusinessBalance + $adjustedDailyBalance,
            'overall_balance'  => $adjustedBusinessBalance + $adjustedDailyBalance,
            'daily_balance'    => $adjustedDailyBalance,
            'business_balance' => $adjustedBusinessBalance,
            'gold_stash'       => $manualGold,
            'total_price'      => $totalPrice,
            'savings_balance'  => $savingsBalance,
        ]);
    }
}
