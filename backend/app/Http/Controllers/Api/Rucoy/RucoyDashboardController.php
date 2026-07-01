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
        return response()->json([
            'total_gold'    => (float) Gold::sum('amount'),
            'trade_count'   => Trade::count(),
            'account_count' => RucoyAccount::count(),
        ]);
    }
}
