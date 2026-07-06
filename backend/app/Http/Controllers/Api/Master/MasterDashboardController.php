<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\Gold;
use App\Models\RucoyAccount;
use App\Models\Saving;
use Illuminate\Http\JsonResponse;

class MasterDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // Rucoy
        $manualGold = (float) Gold::sum('amount');
        $totalPrice = (float) RucoyAccount::whereNull('archived_at')->sum('cost');

        // Savings
        $savingsDeposit  = (float) Saving::where('type', 'deposit')->sum('amount');
        $savingsWithdraw = (float) Saving::where('type', 'withdraw')->sum('amount');
        $savingsBalance  = $savingsDeposit - $savingsWithdraw;

        return response()->json([
            'gold_stash'       => $manualGold,
            'total_price'      => $totalPrice,
            'savings_balance'  => $savingsBalance,
        ]);
    }
}
