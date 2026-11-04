<?php

namespace App\Services;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
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
        $wallet = $data['balance_account'] ?? null;
        unset($data['balance_account']);
        $data = $this->withoutMissingColumns($data);

        return DB::transaction(function () use ($data, $addToInventory, $wallet) {
            $tx = BusinessTransaction::create($data);
            $this->computePhpValues($tx);

            // Bought gold paid from a Balance wallet: deduct its cost there
            if ($wallet && $tx->type === 'gold') {
                // A peso wallet pays the trade's Cost (₱) itself (it may be the ₱ actually paid, typed in)
                $costPhp = $tx->cost_php !== null && (float) $tx->cost_php > 0 ? (float) $tx->cost_php : null;
                $this->payFromWallet($tx, $tx->boughtGold(), $wallet, $tx->date->format('Y-m-d'), '', $costPhp);
            }

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
            // Deleting a pending trade undoes it, so the wallets it was paid from get the money back.
            // A sold trade is history: its payments stay in Balance.
            if ($tx->archived_at === null) {
                $tx->walletEntries()->delete();
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
                // Cost paid in ₱ (0 G): the ₱ cost goes with the gold sold
                $costShare = $tx->costPaidInPhp() ? $f : ($costTotal ? $soldCost / $costTotal : 0);

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
    public function addGold(BusinessTransaction $tx, float $addPrice, float $addCost, string $note, ?string $wallet = null, float $addCostPhp = 0): void
    {
        DB::transaction(function () use ($tx, $addPrice, $addCost, $note, $wallet, $addCostPhp) {
            // Cost paid in ₱: more gold bought costs more ₱ (typed), never cost gold
            $phpPaid = $tx->costPaidInPhp();

            // The added cost is bought at the trade's cost rates (which adding gold never changes)
            if ($wallet && ($addCost > 0 || $addCostPhp > 0)) {
                $this->payFromWallet($tx, $addCost > 0 ? $addCost : $addPrice, $wallet, now('Asia/Manila')->toDateString(), $note, $addCostPhp > 0 ? $addCostPhp : null);
            }

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

            if ($addPrice > 0 || $addCost > 0 || $addCostPhp > 0) {
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
                if ($phpPaid) {
                    $tx->cost_php = round((float) $oldCostPhp + $addCostPhp, 2);
                }
                if ($tx->price_php !== null && $tx->cost_php !== null) {
                    $tx->profit_php = round((float) $tx->price_php - (float) $tx->cost_php, 2);
                    $tx->amount     = $tx->profit_php > 0 ? $tx->profit_php : 0.01;
                }
                $tx->save();
            }
        });
    }

    /**
     * Take gold out of a gold trade to pay for something else (an account). Like a partial sale,
     * the price and cost come off by the gold taken and ₱ follows each side's own rate, but no
     * sale is recorded: the cost moves to what was bought, and profit is counted when that sells.
     * The gold also leaves the stash. A trade used up completely is removed.
     *
     * @return array Exactly what was taken (gold, ₱, progress, stash, the trade's details), for returnGold().
     */
    public function takeGold(BusinessTransaction $tx, float $gold, string $label): array
    {
        $total     = (float) $tx->price_gold;
        $f         = $total > 0 ? min($gold / $total, 1) : 0;
        $costTotal = $tx->cost_gold !== null ? (float) $tx->cost_gold : null;
        $takenCost = $costTotal !== null ? min($gold, $costTotal) : null;
        $costShare = $tx->costPaidInPhp() ? $f : ($costTotal ? $takenCost / $costTotal : 0);
        $hasProgress = SchemaColumns::has('business_transactions', 'price_gold_received');

        $taken = [
            'price_gold' => $gold,
            'cost_gold'  => $takenCost,
            'price_php'  => $tx->price_php !== null ? round((float) $tx->price_php * $f, 2) : null,
            'cost_php'   => $tx->cost_php !== null ? round((float) $tx->cost_php * $costShare, 2) : null,
            'received'   => $hasProgress && $tx->price_gold_received !== null ? min((float) $tx->price_gold_received, $gold) : null,
            'paid'       => $hasProgress && $tx->cost_gold_paid !== null && $takenCost !== null ? min((float) $tx->cost_gold_paid, $takenCost) : null,
            'stash'      => $tx->inventory_gold !== null ? min((float) $tx->inventory_gold, $gold) : 0,
            // Enough to recreate the trade if it gets used up and removed
            'trade' => [
                'description'   => $tx->description,
                'price_rate'    => $tx->price_rate,
                'cost_rate'     => $tx->cost_rate,
                'php_rate'      => $tx->php_rate,
                'cost_php_rate' => $tx->cost_php_rate,
                'date'          => $tx->date?->format('Y-m-d'),
                'notes'         => $tx->notes,
            ],
        ];

        $minus = fn ($v, $p) => $v === null ? null : (float) $v - (float) ($p ?? 0);
        $tx->price_gold = $total - $gold;
        $tx->cost_gold  = $minus($tx->cost_gold, $taken['cost_gold']);
        $tx->price_php  = $tx->price_php !== null ? round($minus($tx->price_php, $taken['price_php']), 2) : null;
        $tx->cost_php   = $tx->cost_php !== null ? round($minus($tx->cost_php, $taken['cost_php']), 2) : null;
        if ($hasProgress) {
            $tx->price_gold_received = $minus($tx->price_gold_received, $taken['received']);
            $tx->cost_gold_paid      = $minus($tx->cost_gold_paid, $taken['paid']);
        }
        if ($tx->inventory_gold !== null) {
            $tx->inventory_gold = max(0, (float) $tx->inventory_gold - $taken['stash']);
        }
        $this->refreshProfit($tx);

        if ($taken['stash'] > 0) {
            GoldInventory::deduct($taken['stash'], $label);
        }

        $taken['removed'] = (float) $tx->price_gold <= 0 && ! $tx->isSystem();
        $taken['removed'] ? $tx->delete() : $tx->save();

        return $taken;
    }

    /**
     * Undo takeGold(): put the gold, ₱ and stash back on the trade. If the trade was used up and
     * removed (or has since been sold), a pending trade with the same details is recreated instead.
     */
    public function returnGold(?BusinessTransaction $tx, array $taken, string $label): BusinessTransaction
    {
        if (! $tx || $tx->archived_at !== null) {
            $trade = $taken['trade'] ?? [];
            $tx = BusinessTransaction::create([
                'type'          => 'gold',
                'description'   => $trade['description'] ?? 'Gold trade',
                'price_rate'    => $trade['price_rate'] ?? null,
                'cost_rate'     => $trade['cost_rate'] ?? null,
                'php_rate'      => $trade['php_rate'] ?? null,
                'cost_php_rate' => $trade['cost_php_rate'] ?? null,
                'date'          => $trade['date'] ?? now('Asia/Manila')->toDateString(),
                'notes'         => trim(($trade['notes'] ?? '') . "\nReturned from a removed account payment"),
                'price_gold'    => 0,
                'cost_gold'     => 0,
                'price_php'     => 0,
                'cost_php'      => 0,
                'amount'        => 0.01,
            ]);
            if ($this->tracksInventory()) {
                $tx->inventory_gold = 0;
            }
        }

        $plus = fn ($v, $p) => $p === null ? $v : (float) ($v ?? 0) + (float) $p;
        $tx->price_gold = $plus($tx->price_gold, $taken['price_gold']);
        $tx->cost_gold  = $plus($tx->cost_gold, $taken['cost_gold']);
        $tx->price_php  = $taken['price_php'] !== null ? round($plus($tx->price_php, $taken['price_php']), 2) : $tx->price_php;
        $tx->cost_php   = $taken['cost_php'] !== null ? round($plus($tx->cost_php, $taken['cost_php']), 2) : $tx->cost_php;
        if (SchemaColumns::has('business_transactions', 'price_gold_received')) {
            $tx->price_gold_received = $plus($tx->price_gold_received, $taken['received']);
            $tx->cost_gold_paid      = $plus($tx->cost_gold_paid, $taken['paid']);
        }

        $stash = (float) ($taken['stash'] ?? 0);
        if ($stash > 0) {
            GoldInventory::record($stash, $label);
            $tx->inventory_gold = (float) ($tx->inventory_gold ?? 0) + $stash;
        }
        $this->refreshProfit($tx);
        $tx->save();

        return $tx;
    }

    /** Deduct the cost of $gold bought on a gold trade from a Balance wallet, in the wallet's currency. */
    private function payFromWallet(BusinessTransaction $tx, float $gold, string $code, string $date, string $note = '', ?float $costPhp = null): BalanceEntry
    {
        $wallet = BalanceAccount::where('code', $code)->firstOrFail();
        $amount = $tx->walletCost($gold, $wallet->currency, $costPhp);
        if ($amount === null) {
            throw new \LogicException('This gold trade has no cost rates to pay from a wallet.');
        }

        return $tx->walletEntries()->create([
            'account'     => $wallet->code,
            'type'        => 'sell', // deducts from the wallet
            'amount'      => $amount,
            'date'        => $date,
            'description' => 'Bought ' . number_format($gold) . ' G: ' . ($note !== '' ? $note : ($tx->description ?: 'Gold trade')),
        ]);
    }

    private function refreshProfit(BusinessTransaction $tx): void
    {
        $tx->profit_php = $tx->price_php !== null && $tx->cost_php !== null
            ? round((float) $tx->price_php - (float) $tx->cost_php, 2)
            : null;
        $tx->amount = $tx->profit_php !== null && $tx->profit_php > 0 ? $tx->profit_php : 0.01;
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

            // Cash deal: the ₱ values come from the cash amounts (USD × its ₱ rate), never gold rates
            if ($account->isCash()) {
                $toPhp = fn ($cash, ?float $rate) => $cash === null ? null
                    : ($account->cash_currency === 'USD' ? ($rate ? round((float) $cash * $rate, 2) : null) : round((float) $cash, 2));
                $tx->price_rate = null;
                $tx->cost_rate  = null;
                $tx->price_php  = $toPhp($account->price_cash, $pricePhpRate);
                $tx->cost_php   = $toPhp($account->cost_cash, $costPhpRate);
                $this->refreshProfit($tx);
                $tx->save();

                return;
            }

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

            // Paid with payments: their exact rates win over the single typed cost rate
            if ($account->payments()->exists()) {
                AccountCost::apply($tx, $account);
            }

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
