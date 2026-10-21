<?php

namespace App\Services;

use App\Models\BusinessTransaction;
use App\Models\MiddlemanFee;
use App\Models\RucoyAccount;
use App\Support\SchemaColumns;
use Illuminate\Support\Facades\DB;

/** Creating, changing and selling business transactions (Sales), and their effect on the gold stash. */
class BusinessTransactionService
{
    public function create(array $data, bool $addToInventory): BusinessTransaction
    {
        $data = $this->withoutMissingColumns($data);

        return DB::transaction(function () use ($data, $addToInventory) {
            $tx = BusinessTransaction::create($data);
            $this->computePhpValues($tx);

            // New gold trades from the Add Gold dialog put their price gold into the Golds inventory
            if ($addToInventory && $tx->type === 'gold' && ! $tx->isSystem() && $this->tracksInventory()) {
                $tx->inventory_gold = 0;
                $this->syncInventory($tx, 'Added');
            }

            return $tx;
        });
    }

    public function update(BusinessTransaction $tx, array $data): void
    {
        $data = $this->withoutMissingColumns($data);

        DB::transaction(function () use ($tx, $data) {
            $tx->update($data);
            $this->computePhpValues($tx);
            // Tracked trades keep the inventory in step with their price gold
            if ($tx->inventory_gold !== null && $tx->archived_at === null) {
                $this->syncInventory($tx->fresh(), 'Adjusted');
            }
        });
    }

    public function delete(BusinessTransaction $tx): void
    {
        DB::transaction(function () use ($tx) {
            // Take back the gold this (unsold) trade put into the inventory
            $inv = (float) ($tx->inventory_gold ?? 0);
            if ($inv != 0 && $tx->archived_at === null) {
                GoldInventory::record(-$inv, 'Removed: ' . ($tx->description ?: 'Gold trade'));
            }
            $tx->delete();
        });
    }

    /**
     * Sell all or part of a gold trade. The sold portion is archived (so it counts toward
     * the month's sold profit) with values pro-rated by the gold sold; the rest stays pending.
     *
     * @return array{0: BusinessTransaction, 1: ?BusinessTransaction} [sold, remaining]
     */
    public function sell(BusinessTransaction $tx, float $sell, string $note, bool $deductInventory): array
    {
        $total       = (float) $tx->price_gold;
        $withNote    = fn (?string $notes, string $line) => trim(($notes ? $notes . "\n" : '') . $line);
        $hasProgress = SchemaColumns::has('business_transactions', 'price_gold_received');

        return DB::transaction(function () use ($tx, $total, $sell, $hasProgress, $deductInventory, $note, $withNote) {
            // A permanent trade is never archived: even a full sale splits off and leaves it at 0 G
            if ($sell >= $total && ! $tx->isSystem()) {
                if ($note !== '') {
                    $tx->notes = $withNote($tx->notes, 'Sold: ' . $note);
                }
                $tx->archived_at = now();
                $tx->save();
                $sold      = $tx;
                $remaining = null;
            } else {
                $f     = $sell / $total;
                $part  = fn ($v, int $dp = 2) => $v === null ? null : round((float) $v * $f, $dp);
                $minus = fn ($v, $p) => $v === null ? null : (float) $v - (float) $p;

                $sold                 = $tx->replicate();
                $sold->system_key     = null;
                $sold->inventory_gold = null; // the sold piece is history; only the open trade is tracked
                // Cost comes off by the same amount of gold as the price (e.g. sell 200 of 1,200 / 700
                // → 1,000 / 500), never more than the cost there is; ₱ follows each side's own rate.
                $costTotal = $tx->cost_gold !== null ? (float) $tx->cost_gold : null;
                $soldCost  = $costTotal !== null ? min($sell, $costTotal) : null;
                $costShare = $costTotal ? $soldCost / $costTotal : 0;

                $sold->price_gold  = $sell;
                $sold->cost_gold   = $soldCost;
                $sold->price_php   = $part($tx->price_php);
                $sold->cost_php    = $tx->cost_php !== null ? round((float) $tx->cost_php * $costShare, 2) : null;
                $sold->profit_php  = $sold->cost_php !== null ? round($sold->price_php - $sold->cost_php, 2) : null;
                $sold->amount      = $sold->profit_php !== null ? max($sold->profit_php, 0.01) : max($part($tx->amount), 0.01);
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
                $tx->amount     = $tx->profit_php !== null
                    ? max($tx->profit_php, 0.01)
                    : max(round((float) $tx->amount - (float) $sold->amount, 2), 0.01);
                if ($hasProgress) {
                    $tx->price_gold_received = $minus($tx->price_gold_received, $sold->price_gold_received);
                    $tx->cost_gold_paid      = $minus($tx->cost_gold_paid, $sold->cost_gold_paid);
                }
                // The sold gold leaves with the sale; keep the tracked amount in step with the remaining price
                if ($tx->inventory_gold !== null) {
                    $tx->inventory_gold = max(0, (float) $tx->inventory_gold - $sell);
                }
                $tx->save();
                $remaining = $tx;
            }

            if ($deductInventory) {
                GoldInventory::deduct($sell, $note !== '' ? $note : 'Sold: ' . ($tx->description ?: 'Gold trade'));
            }

            return [$sold, $remaining];
        });
    }

    /**
     * Add gold onto a gold trade's price and/or cost (₱ recalculated from its rates). Price gold
     * also goes into the Golds inventory; on the permanent Middleman Fee trade it is recorded as
     * a middleman fee instead.
     */
    public function addGold(BusinessTransaction $tx, float $addPrice, float $addCost, string $note): void
    {
        DB::transaction(function () use ($tx, $addPrice, $addCost, $note) {
            $label = $note !== '' ? $note : ($tx->description ?: 'Gold trade');

            if ($tx->isSystem() && $addPrice > 0) {
                // Same as recording a middleman fee: inventory + history + fee record.
                // The MiddlemanFee observer adds it onto this trade's price.
                GoldInventory::record($addPrice, $label, 'fee');
                MiddlemanFee::create(['amount' => $addPrice, 'description' => $label]);
                $tx->refresh();
                $addPrice = 0;
            } elseif ($addPrice > 0) {
                GoldInventory::record($addPrice, $label);
            }

            if ($addPrice > 0 || $addCost > 0) {
                $oldPrice    = (float) $tx->price_gold;
                $oldCost     = (float) $tx->cost_gold;
                $oldPricePhp = $tx->price_php;
                $oldCostPhp  = $tx->cost_php;

                $tx->price_gold = $oldPrice + $addPrice;
                $tx->cost_gold  = $oldCost + $addCost;
                // Already added to the inventory above — record it so a later edit doesn't add it again
                if ($tx->inventory_gold !== null) {
                    $tx->inventory_gold = (float) $tx->inventory_gold + $addPrice;
                }
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
    }

    private function tracksInventory(): bool
    {
        return SchemaColumns::has('business_transactions', 'inventory_gold');
    }

    /**
     * Move the difference between a tracked trade's price gold and what it has already
     * put into the inventory, so the stash always reflects it exactly once.
     */
    private function syncInventory(BusinessTransaction $tx, string $verb): void
    {
        if ($tx->inventory_gold === null || ! $this->tracksInventory()) {
            return;
        }
        $delta = (float) ($tx->price_gold ?? 0) - (float) $tx->inventory_gold;
        if ($delta != 0) {
            GoldInventory::record($delta, $verb . ': ' . ($tx->description ?: 'Gold trade'));
        }
        $tx->inventory_gold = (float) ($tx->price_gold ?? 0);
        $tx->saveQuietly();
    }

    /** Drop optional columns that older databases may not have yet. */
    private function withoutMissingColumns(array $data): array
    {
        foreach (['cost_php_rate', 'price_gold_received', 'cost_gold_paid'] as $column) {
            if (array_key_exists($column, $data) && ! SchemaColumns::has('business_transactions', $column)) {
                unset($data[$column]);
            }
        }

        return $data;
    }

    private function computePhpValues(BusinessTransaction $tx): void
    {
        if ($tx->type === 'account') {
            if (! $tx->account_id) {
                return;
            }

            $account = RucoyAccount::find($tx->account_id);
            if (! $account) {
                return;
            }

            $pricePhpRate = $tx->php_rate ? (float) $tx->php_rate : null;
            $costPhpRate  = (isset($tx->cost_php_rate) && $tx->cost_php_rate !== null)
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
        $costPhp  = $tx->cost_php !== null ? (float) $tx->cost_php : null;

        $tx->profit_php = ($pricePhp !== null && $costPhp !== null)
            ? round($pricePhp - $costPhp, 2)
            : null;

        $tx->save();
    }
}
