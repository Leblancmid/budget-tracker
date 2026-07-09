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
        $kksGold    = (float) Trade::where('status', 'kks')->whereNull('archived_at')->sum('amount');

        $activeAccounts = RucoyAccount::whereNull('archived_at')->get();

        return response()->json([
            'total_gold'           => $manualGold + $kksGold,
            'manual_gold'          => $manualGold,
            'kks_gold'             => $kksGold,
            'trade_count'          => Trade::whereNull('archived_at')->count(),
            'account_count'        => $activeAccounts->count(),
            'account_total_cost'   => (float) $activeAccounts->sum('cost'),
            'account_total_price'  => (float) $activeAccounts->sum('price'),
        ]);
    }
}
