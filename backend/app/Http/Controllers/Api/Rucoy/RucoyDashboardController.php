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
        $kksGold    = (float) Trade::where('status', 'kks')->sum('amount');

        return response()->json([
            'total_gold'    => $manualGold + $kksGold,
            'trade_count'   => Trade::count(),
            'account_count' => RucoyAccount::count(),
        ]);
    }
}
