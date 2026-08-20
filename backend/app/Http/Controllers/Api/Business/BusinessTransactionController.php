<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\StoreBusinessTransactionRequest;
use App\Http\Requests\Business\UpdateBusinessTransactionRequest;
use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessTransactionController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year', now()->year);

        $txns    = BusinessTransaction::whereNotNull('archived_at')
            ->whereMonth('archived_at', $month)
            ->whereYear('archived_at', $year)
            ->get();

        $income  = (float) $txns->whereNotIn('type', ['expense'])->sum('price_php');
        $expense = (float) $txns->whereNotIn('type', ['expense'])->sum('cost_php')
                 + (float) $txns->where('type', 'expense')->sum('amount');

        return response()->json([
            'income'  => round($income, 2),
            'expense' => round($expense, 2),
            'profit'  => round($income - $expense, 2),
            'month'   => $month,
            'year'    => $year,
        ]);
    }

    public function index(): JsonResponse
    {
        return response()->json(
            BusinessTransaction::whereNull('archived_at')->latest('date')->latest('id')->get()
        );
    }

    public function archived(): JsonResponse
    {
        return response()->json(
            BusinessTransaction::whereNotNull('archived_at')->latest('archived_at')->get()
        );
    }

    public function archive(BusinessTransaction $businessTransaction): JsonResponse
    {
        $businessTransaction->archived_at = now();
        $businessTransaction->save();

        return response()->json($businessTransaction->fresh());
    }

    public function unarchive(BusinessTransaction $businessTransaction): JsonResponse
    {
        $businessTransaction->archived_at = null;
        $businessTransaction->save();

        return response()->json($businessTransaction->fresh());
    }

    public function store(StoreBusinessTransactionRequest $request): JsonResponse
    {
        $tx = BusinessTransaction::create($request->validated());
        $this->computePhpValues($tx);

        return response()->json($tx->fresh(), 201);
    }

    public function update(UpdateBusinessTransactionRequest $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        $businessTransaction->update($request->validated());
        $this->computePhpValues($businessTransaction);

        return response()->json($businessTransaction->fresh());
    }

    public function destroy(BusinessTransaction $businessTransaction): JsonResponse
    {
        $businessTransaction->delete();

        return response()->json(['message' => 'Transaction deleted.']);
    }

    private function computePhpValues(BusinessTransaction $tx): void
    {
        if ($tx->type === 'account') {
            if (!$tx->account_id || !$tx->php_rate) return;

            $account = RucoyAccount::find($tx->account_id);
            if (!$account) return;

            $phpRate = (float) $tx->php_rate;

            $pricePhp = ($account->price !== null && $tx->price_rate)
                ? round(((float) $account->price / 1_000_000) * (float) $tx->price_rate * $phpRate, 2)
                : null;

            $costPhp = ($account->cost !== null && $tx->cost_rate)
                ? round(((float) $account->cost / 1_000_000) * (float) $tx->cost_rate * $phpRate, 2)
                : null;

            $tx->price_php  = $pricePhp;
            $tx->cost_php   = $costPhp;
            $tx->profit_php = ($pricePhp !== null && $costPhp !== null)
                ? round($pricePhp - $costPhp, 2)
                : null;

            $tx->save();
            return;
        }

        // For gold/expense: price_php and cost_php come from the request; just derive profit_php
        $pricePhp = $tx->price_php !== null ? (float) $tx->price_php : null;
        $costPhp  = $tx->cost_php  !== null ? (float) $tx->cost_php  : null;

        $tx->profit_php = ($pricePhp !== null && $costPhp !== null)
            ? round($pricePhp - $costPhp, 2)
            : null;

        $tx->save();
    }
}
