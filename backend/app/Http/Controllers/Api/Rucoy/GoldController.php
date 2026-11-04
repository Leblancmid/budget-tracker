<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\Rucoy\AdjustGoldRequest;
use App\Http\Requests\Rucoy\SellGoldRequest;
use App\Http\Requests\Rucoy\StoreGoldRequest;
use App\Http\Requests\Rucoy\UpdateGoldRequest;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Services\BusinessTransactionService;
use App\Services\GoldInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class GoldController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Gold::latest()->get());
    }

    public function store(StoreGoldRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $gold      = GoldInventory::record((float) $validated['amount'], $validated['description'] ?? null);

        return response()->json($gold, 201);
    }

    public function sell(SellGoldRequest $request): JsonResponse
    {
        $validated = $request->validated();

        GoldInventory::deduct((float) $validated['amount'], $validated['description'] ?? null);

        return response()->json(Gold::latest()->get());
    }

    public function logs(): JsonResponse
    {
        return response()->json(GoldLog::latest()->get());
    }

    /**
     * Undo a history entry: reverse its effect on the stash and keep the line, marked undone.
     * A gold trade sale is undone completely: the sold gold goes back onto its trade too.
     */
    public function cancelLog(GoldLog $goldLog, BusinessTransactionService $transactions): JsonResponse
    {
        if ($goldLog->cancelled_at) {
            return response()->json(['message' => 'This entry is already undone.'], 422);
        }

        DB::transaction(function () use ($goldLog, $transactions) {
            if (($goldLog->undo['kind'] ?? null) === 'trade_sale') {
                $transactions->undoSale($goldLog->undo);
            }

            $amount = (float) $goldLog->amount;
            // add / fee put gold in (amount may be negative for removals); sell took gold out
            $effect = $goldLog->type === 'sell' ? -abs($amount) : $amount;

            if ($effect != 0) {
                Gold::create([
                    'amount'      => -$effect,
                    'description' => 'Undone: ' . ($goldLog->description ?: ucfirst($goldLog->type)),
                ]);
            }
            $goldLog->cancelled_at = now();
            $goldLog->save();
        });

        return response()->json($goldLog->fresh());
    }

    /** Set the stash to the gold you actually have: records one correction for the difference. */
    public function adjust(AdjustGoldRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $current = (float) Gold::sum('amount');
        $delta   = round((float) $validated['actual'] - $current);

        if ($delta != 0) {
            $label = trim((string) ($validated['description'] ?? '')) ?: 'Stash correction';
            DB::transaction(fn () => GoldInventory::record($delta, $label));
        }

        return response()->json(['previous' => $current, 'delta' => $delta, 'stash' => (float) Gold::sum('amount')]);
    }

    public function update(UpdateGoldRequest $request, Gold $gold): JsonResponse
    {
        $gold->update($request->validated());

        return response()->json($gold);
    }

    public function destroy(Gold $gold): JsonResponse
    {
        if ($gold->trades()->exists()) {
            return response()->json(['message' => 'Cannot delete gold with existing trades.'], 422);
        }

        $gold->delete();

        return response()->json(['message' => 'Gold deleted.']);
    }
}
