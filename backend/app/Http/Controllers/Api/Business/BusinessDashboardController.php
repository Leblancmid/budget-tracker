<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Models\BusinessTransaction;
use Illuminate\Http\JsonResponse;

class BusinessDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $income  = (float) BusinessTransaction::whereIn('type', ['account', 'gold'])->sum('amount');
        $expense = (float) BusinessTransaction::where('type', 'expense')->sum('amount');

        return response()->json([
            'total_income'  => $income,
            'total_expense' => $expense,
            'total_profit'  => $income - $expense,
            'balance'       => $income - $expense,
        ]);
    }
}
