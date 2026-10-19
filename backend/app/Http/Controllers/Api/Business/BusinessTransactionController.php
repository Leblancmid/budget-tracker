<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\StoreBusinessTransactionRequest;
use App\Http\Requests\Business\UpdateBusinessTransactionRequest;
use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Models\MiddlemanFee;
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
            'description'      => ['nullable', 'string', 'max:255'],
        ]);

        $tx    = $businessTransaction;
        $total = (float) $tx->price_gold;
        $sell  = (float) $validated['amount'];
        $note  = trim((string) ($validated['description'] ?? ''));
        $withNote = fn (?string $notes, string $line) => trim(($notes ? $notes . "\n" : '') . $line);

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

        [$sold, $remaining] = DB::transaction(function () use ($tx, $total, $sell, $hasProgress, $validated, $note, $withNote) {
            // A permanent trade is never archived: even a full sale splits off and leaves it at 0 G
            if ($sell >= $total && !$tx->isSystem()) {
                if ($note !== '') $tx->notes = $withNote($tx->notes, 'Sold: ' . $note);
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
                $sold->notes       = $withNote($tx->notes, 'Partial sale of ' . number_format($sell) . ' / ' . number_format($total) . ' G' . ($note !== '' ? ' — ' . $note : ''));
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
                GoldInventory::deduct($sell, $note !== '' ? $note : 'Sold: ' . ($tx->description ?: 'Gold trade'));
            }

            return [$sold, $remaining];
        });

        return response()->json([
            'sold'      => $sold->fresh(),
            'remaining' => $remaining?->fresh(),
        ]);
    }

    /**
     * Add gold onto a pending gold trade's price and/or cost (₱ recalculated from
     * its rates). Price gold also goes into the Golds inventory; on the permanent
     * Middleman Fee trade it is recorded as a middleman fee instead.
     */
    public function addGold(Request $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        $validated = $request->validate([
            'price_gold'  => ['nullable', 'numeric', 'min:0'],
            'cost_gold'   => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $tx        = $businessTransaction;
        $addPrice  = (float) ($validated['price_gold'] ?? 0);
        $addCost   = (float) ($validated['cost_gold'] ?? 0);
        $note      = trim((string) ($validated['description'] ?? ''));

        if ($tx->type !== 'gold' || $tx->archived_at !== null) {
            return response()->json(['message' => 'Gold can only be added to pending gold trades.'], 422);
        }
        if ($addPrice <= 0 && $addCost <= 0) {
            return response()->json(['errors' => ['price_gold' => ['Enter gold to add to the price or cost.']]], 422);
        }

        DB::transaction(function () use ($tx, $addPrice, $addCost, $note) {
            $label = $note !== '' ? $note : ($tx->description ?: 'Gold trade');

            if ($tx->isSystem() && $addPrice > 0) {
                // Same as recording a middleman fee: inventory + history + fee record.
                // The MiddlemanFee observer adds it onto this trade's price.
                Gold::create(['amount' => $addPrice, 'description' => $label]);
                GoldLog::create(['type' => 'fee', 'amount' => $addPrice, 'description' => $label]);
                MiddlemanFee::create(['amount' => $addPrice, 'description' => $label]);
                $tx->refresh();
                $addPrice = 0;
            } elseif ($addPrice > 0) {
                Gold::create(['amount' => $addPrice, 'description' => $label]);
                GoldLog::create(['type' => 'add', 'amount' => $addPrice, 'description' => $label]);
            }

            if ($addPrice > 0 || $addCost > 0) {
                $oldPrice = (float) $tx->price_gold;
                $oldCost  = (float) $tx->cost_gold;
                $oldPricePhp = $tx->price_php;
                $oldCostPhp  = $tx->cost_php;

                $tx->price_gold = $oldPrice + $addPrice;
                $tx->cost_gold  = $oldCost + $addCost;
                $tx->recomputeGoldPhp();

                // No rates yet but a ₱ value exists: scale it with the gold instead of dropping it
                if ($tx->price_php === null && $oldPricePhp !== null && $oldPrice > 0) {
                    $tx->price_php = round((float) $oldPricePhp * ($tx->price_gold / $oldPrice), 2);
                }
                if ($tx->cost_php === null && $oldCostPhp !== null && $oldCost > 0) {
                    $tx->cost_php = round((float) $oldCostPhp * ($tx->cost_gold / $oldCost), 2);
                }
                if ($tx->price_php !== null && $tx->cost_php !== null) {
                    $tx->profit_php = round((float) $tx->price_php - (float) $tx->cost_php, 2);
                    $tx->amount     = $tx->profit_php > 0 ? $tx->profit_php : 0.01;
                }
                $tx->save();
            }
        });

        return response()->json($tx->fresh());
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
