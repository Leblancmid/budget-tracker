<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\AddGoldRequest;
use App\Http\Requests\Business\MarkSoldRequest;
use App\Http\Requests\Business\SellBusinessTransactionRequest;
use App\Http\Requests\Business\StoreBusinessTransactionRequest;
use App\Http\Requests\Business\UpdateBusinessTransactionRequest;
use App\Models\BusinessTransaction;
use App\Services\BusinessProfit;
use App\Services\BusinessTransactionService;
use App\Services\MiddlemanFeeTrade;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessTransactionController extends Controller
{
    /** The wallet payments a gold trade lists (what paid for its bought gold) */
    private const WALLET_ENTRIES = 'walletEntries:id,business_transaction_id,account,amount,date';

    public function __construct(private readonly BusinessTransactionService $transactions) {}

    public function summary(Request $request): JsonResponse
    {
        $month = $request->integer('month', now()->month);
        $year  = $request->integer('year', now()->year);

        $realized = BusinessProfit::realized(
            BusinessTransaction::archived()->whereMonth('archived_at', $month)->whereYear('archived_at', $year)->get()
        );

        return response()->json([
            'income'  => round($realized['income'], 2),
            'expense' => round($realized['expense'], 2),
            'profit'  => round($realized['profit'], 2),
            'month'   => $month,
            'year'    => $year,
        ]);
    }

    public function index(): JsonResponse
    {
        MiddlemanFeeTrade::get(); // make sure the pinned Middleman Fee trade exists

        return response()->json(BusinessTransaction::active()->with(self::WALLET_ENTRIES)->latest('date')->latest('id')->get());
    }

    public function archived(): JsonResponse
    {
        return response()->json(BusinessTransaction::archived()->latest('archived_at')->get());
    }

    /** Names you sold to before, most recent first (suggestions when marking a sale sold). */
    public function buyers(): JsonResponse
    {
        return response()->json(BusinessTransaction::whereNotNull('sold_to')
            ->selectRaw('sold_to, MAX(archived_at) as last_sold')->groupBy('sold_to')
            ->orderByDesc('last_sold')->limit(100)->pluck('sold_to'));
    }

    /** Mark sold, optionally saying who bought it. */
    public function archive(MarkSoldRequest $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        if ($businessTransaction->isSystem()) {
            return response()->json(['message' => 'This trade is permanent — sell its gold instead.'], 422);
        }

        $businessTransaction->archived_at = now();
        $businessTransaction->sold_to = self::buyer($request->validated('sold_to'));
        $businessTransaction->save();

        return response()->json($businessTransaction->fresh());
    }

    public function unarchive(BusinessTransaction $businessTransaction): JsonResponse
    {
        // Back on sale: whoever it was sold to no longer applies
        $businessTransaction->archived_at = null;
        $businessTransaction->sold_to = null;
        $businessTransaction->save();

        return response()->json($businessTransaction->fresh());
    }

    public function store(StoreBusinessTransactionRequest $request): JsonResponse
    {
        $tx = $this->transactions->create($request->validated(), $request->boolean('add_to_inventory'));

        return response()->json($tx->fresh()->load(self::WALLET_ENTRIES), 201);
    }

    public function update(UpdateBusinessTransactionRequest $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        $this->transactions->update($businessTransaction, $request->validated());

        return response()->json($businessTransaction->fresh()->load(self::WALLET_ENTRIES));
    }

    public function destroy(BusinessTransaction $businessTransaction): JsonResponse
    {
        if ($businessTransaction->isSystem()) {
            return response()->json(['message' => 'The Middleman Fee trade cannot be deleted.'], 422);
        }

        $this->transactions->delete($businessTransaction);

        return response()->json(['message' => 'Transaction deleted.']);
    }

    /** Sell all or part of a pending gold trade, optionally deducting the gold from inventory. */
    public function sell(SellBusinessTransactionRequest $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        $validated = $request->validated();
        $total     = (float) $businessTransaction->price_gold;
        $sell      = (float) $validated['amount'];

        if ($businessTransaction->type !== 'gold' || $businessTransaction->archived_at !== null) {
            return response()->json(['message' => 'Only pending gold trades can be sold.'], 422);
        }
        if ($businessTransaction->price_php === null || $total <= 0) {
            return response()->json(['message' => 'Set the rates for this trade before selling it.'], 422);
        }
        if ($sell > $total) {
            return response()->json(['errors' => ['amount' => ['Cannot sell more than ' . number_format($total) . ' G.']]], 422);
        }

        [$sold, $remaining] = $this->transactions->sell(
            $businessTransaction,
            $sell,
            trim((string) ($validated['description'] ?? '')),
            (bool) ($validated['deduct_inventory'] ?? false),
            self::buyer($validated['sold_to'] ?? null),
        );

        return response()->json([
            'sold'      => $sold->fresh(),
            'remaining' => $remaining?->fresh(),
        ]);
    }

    /** Add gold onto a pending gold trade's price and/or cost. */
    public function addGold(AddGoldRequest $request, BusinessTransaction $businessTransaction): JsonResponse
    {
        $validated = $request->validated();
        $addPrice  = (float) ($validated['price_gold'] ?? 0);
        $addCost   = (float) ($validated['cost_gold'] ?? 0);
        $addCostPhp = (float) ($validated['cost_php'] ?? 0);

        if ($businessTransaction->type !== 'gold' || $businessTransaction->archived_at !== null) {
            return response()->json(['message' => 'Gold can only be added to pending gold trades.'], 422);
        }
        if ($addPrice <= 0 && $addCost <= 0 && $addCostPhp <= 0) {
            return response()->json(['errors' => ['price_gold' => ['Enter gold to add to the price or cost.']]], 422);
        }

        $this->transactions->addGold($businessTransaction, $addPrice, $addCost, trim((string) ($validated['description'] ?? '')), $validated['balance_account'] ?? null, $addCostPhp);

        return response()->json($businessTransaction->fresh()->load(self::WALLET_ENTRIES));
    }

    /** A buyer as typed, or null when left empty. */
    private static function buyer(?string $name): ?string
    {
        $name = trim((string) $name);

        return $name === '' ? null : $name;
    }
}
