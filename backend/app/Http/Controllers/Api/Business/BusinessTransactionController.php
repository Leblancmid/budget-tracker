<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\StoreBusinessTransactionRequest;
use App\Http\Requests\Business\UpdateBusinessTransactionRequest;
use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use Illuminate\Http\JsonResponse;

class BusinessTransactionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            BusinessTransaction::whereNull('archived_at')->latest('date')->latest('id')->get()
        );
    }

    public function archived(): JsonResponse
    {
        return response()->json(
            BusinessTransaction::whereNotNull('archived_at')->where('type', 'account')->latest('archived_at')->get()
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
        // Only account-type transactions derive values from the linked RucoyAccount
        if ($tx->type !== 'account' || !$tx->account_id || !$tx->php_rate) {
            return;
        }

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
    }
}
