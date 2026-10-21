<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Models\Gold;
use App\Models\RucoyAccount;
use App\Models\Trade;
use Illuminate\Http\JsonResponse;

class RucoyDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $manualGold = (float) Gold::sum('amount');
        $kksGold    = (float) Trade::where('status', 'kks')->active()->sum('amount');

        $activeAccounts = RucoyAccount::active()->get();

        return response()->json([
            'total_gold'          => $manualGold + $kksGold,
            'manual_gold'         => $manualGold,
            'kks_gold'            => $kksGold,
            'trade_count'         => Trade::active()->count(),
            'account_count'       => $activeAccounts->count(),
            'account_total_cost'  => (float) $activeAccounts->sum('cost'),
            'account_total_price' => (float) $activeAccounts->sum('price'),
            'accounts_to_pay'     => (float) $activeAccounts->where('payment_status', 'not_paid')->sum('cost'),
        ]);
    }
}
