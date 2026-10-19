<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\StoreBusinessTransactionRequest;
use App\Http\Requests\Business\UpdateBusinessTransactionRequest;
use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use App\Services\GoldInventory;
use App\Services\MiddlemanFeeTrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
        MiddlemanFeeTrade::get(); // make sure the pinned Middleman Fee trade exists

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
        if ($businessTransaction->isSystem()) {
            return response()->json(['message' => 'This trade is permanent — sell its gold instead.'], 422);
        }

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
        $data = $this->withoutMissingColumns($request->validated());

        $tx = BusinessTransaction::create($data);
        $this->computePhpValues($tx);

        return response()->json($tx->fresh(), 201);
    }

    public function update(UpdateBusinessTransactionRequest $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        $data = $this->withoutMissingColumns($request->validated());

        $businessTransaction->update($data);
        $this->computePhpValues($businessTransaction);

        return response()->json($businessTransaction->fresh());
    }

    public function destroy(BusinessTransaction $businessTransaction): JsonResponse
    {
        if ($businessTransaction->isSystem()) {
            return response()->json(['message' => 'The Middleman Fee trade cannot be deleted.'], 422);
        }

        $businessTransaction->delete();

        return response()->json(['message' => 'Transaction deleted.']);
    }

    /**
     * Sell all or part of a confirmed gold trade. The sold portion is archived
     * (so it counts toward the month's sold profit) with values pro-rated by the
     * gold sold; the rest stays pending. Optionally deducts the gold from inventory.
     */
    public function sell(Request $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        $validated = $request->validate([
            'amount'           => ['required', 'numeric', 'min:1'],
            'deduct_inventory' => ['sometimes', 'boolean'],
        ]);

        $tx    = $businessTransaction;
        $total = (float) $tx->price_gold;
        $sell  = (float) $validated['amount'];

        if ($tx->type !== 'gold' || $tx->archived_at !== null) {
            return response()->json(['message' => 'Only pending gold trades can be sold.'], 422);
        }
        if ($tx->price_php === null || $total <= 0) {
            return response()->json(['message' => 'Set the rates for this trade before selling it.'], 422);
        }
        if ($sell > $total) {
            return response()->json(['errors' => ['amount' => ['Cannot sell more than ' . number_format($total) . ' G.']]], 422);
        }

        $hasProgress = Schema::hasColumn('business_transactions', 'price_gold_received');

        [$sold, $remaining] = DB::transaction(function () use ($tx, $total, $sell, $hasProgress, $validated) {
            // A permanent trade is never archived: even a full sale splits off and leaves it at 0 G
            if ($sell >= $total && !$tx->isSystem()) {
                $tx->archived_at = now();
                $tx->save();
                $sold = $tx;
                $remaining = null;
            } else {
                $f     = $sell / $total;
                $part  = fn ($v, int $dp = 2) => $v === null ? null : round((float) $v * $f, $dp);
                $minus = fn ($v, $p) => $v === null ? null : (float) $v - (float) $p;

                $sold = $tx->replicate();
                $sold->system_key  = null;
                $sold->price_gold  = $sell;
                $sold->cost_gold   = $part($tx->cost_gold, 0);
                $sold->price_php   = $part($tx->price_php);
                $sold->cost_php    = $part($tx->cost_php);
                $sold->profit_php  = $sold->cost_php !== null ? round($sold->price_php - $sold->cost_php, 2) : null;
                $sold->amount      = max($part($tx->amount), 0.01);
                $sold->notes       = trim(($tx->notes ? $tx->notes . "\n" : '') . 'Partial sale of ' . number_format($sell) . ' / ' . number_format($total) . ' G');
                $sold->archived_at = now();
                if ($hasProgress) {
                    $sold->price_gold_received = $tx->price_gold_received !== null ? min((float) $tx->price_gold_received, $sell) : null;
                    $sold->cost_gold_paid      = $tx->cost_gold_paid !== null && $sold->cost_gold !== null ? min((float) $tx->cost_gold_paid, $sold->cost_gold) : null;
                }
                $sold->save();

                $tx->price_gold = $total - $sell;
                $tx->cost_gold  = $minus($tx->cost_gold, $sold->cost_gold);
                $tx->price_php  = round($minus($tx->price_php, $sold->price_php), 2);
                $tx->cost_php   = $tx->cost_php !== null ? round($minus($tx->cost_php, $sold->cost_php), 2) : null;
                $tx->profit_php = $tx->cost_php !== null ? round($tx->price_php - $tx->cost_php, 2) : null;
                $tx->amount     = max(round((float) $tx->amount - (float) $sold->amount, 2), 0.01);
                if ($hasProgress) {
                    $tx->price_gold_received = $minus($tx->price_gold_received, $sold->price_gold_received);
                    $tx->cost_gold_paid      = $minus($tx->cost_gold_paid, $sold->cost_gold_paid);
                }
                $tx->save();
                $remaining = $tx;
            }

            if ($validated['deduct_inventory'] ?? false) {
                GoldInventory::deduct($sell, 'Sold: ' . ($tx->description ?: 'Gold trade'));
            }

            return [$sold, $remaining];
        });

        return response()->json([
            'sold'      => $sold->fresh(),
            'remaining' => $remaining?->fresh(),
        ]);
    }

    /** Drop optional columns that older databases may not have yet. */
    private function withoutMissingColumns(array $data): array
    {
        foreach (['cost_php_rate', 'price_gold_received', 'cost_gold_paid'] as $column) {
            if (array_key_exists($column, $data) && !Schema::hasColumn('business_transactions', $column)) {
                unset($data[$column]);
            }
        }
        return $data;
    }

    private function computePhpValues(BusinessTransaction $tx): void
    {
        if ($tx->type === 'account') {
            if (!$tx->account_id) return;

            $account = RucoyAccount::find($tx->account_id);
            if (!$account) return;

            $pricePhpRate = $tx->php_rate ? (float) $tx->php_rate : null;
            $costPhpRate = (isset($tx->cost_php_rate) && $tx->cost_php_rate !== null)
                ? (float) $tx->cost_php_rate
                : $pricePhpRate;

            $pricePhp = $tx->price_php !== null
                ? (float) $tx->price_php
                : (($account->price !== null && $tx->price_rate && $pricePhpRate)
                    ? round(((float) $account->price / 1_000_000) * (float) $tx->price_rate * $pricePhpRate, 2)
                    : null);

            $costPhp = $tx->cost_php !== null
                ? (float) $tx->cost_php
                : (($account->cost !== null && $tx->cost_rate && $costPhpRate)
                    ? round(((float) $account->cost / 1_000_000) * (float) $tx->cost_rate * $costPhpRate, 2)
                    : null);

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
