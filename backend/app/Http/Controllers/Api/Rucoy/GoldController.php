<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreGoldRequest;
use App\Http\Requests\UpdateGoldRequest;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Services\GoldInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GoldController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Gold::latest()->get());
    }

    public function store(StoreGoldRequest $request): JsonResponse
    {
        $gold = Gold::create($request->validated());

        GoldLog::create([
            'type'        => 'add',
            'amount'      => $gold->amount,
            'description' => $gold->description,
        ]);

        return response()->json($gold, 201);
    }

    public function sell(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        GoldInventory::deduct((float) $validated['amount'], $validated['description'] ?? null);

        return response()->json(Gold::latest()->get());
    }

    public function logs(): JsonResponse
    {
        return response()->json(GoldLog::latest()->get());
    }

    /**
     * Cancel a history entry: undo its effect on the stash and keep the line, marked cancelled.
     * (Previously this only deleted the log line, so the stash never changed.)
     */
    public function cancelLog(GoldLog $goldLog): JsonResponse
    {
        if ($goldLog->cancelled_at) {
            return response()->json(['message' => 'This entry is already cancelled.'], 422);
        }

        DB::transaction(function () use ($goldLog) {
            $amount = (float) $goldLog->amount;
            // add / fee put gold in (amount may be negative for removals); sell took gold out
            $effect = $goldLog->type === 'sell' ? -abs($amount) : $amount;

            if ($effect != 0) {
                Gold::create([
                    'amount'      => -$effect,
                    'description' => 'Cancelled: ' . ($goldLog->description ?: ucfirst($goldLog->type)),
                ]);
            }
            $goldLog->cancelled_at = now();
            $goldLog->save();
        });

        return response()->json($goldLog->fresh());
    }

    /**
     * Set the stash to the gold you actually have: records one correction for the difference.
     */
    public function adjust(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'actual'      => ['required', 'numeric'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $current = (float) Gold::sum('amount');
        $delta   = round((float) $validated['actual'] - $current);

        if ($delta != 0) {
            $label = trim((string) ($validated['description'] ?? '')) ?: 'Stash correction';
            DB::transaction(function () use ($delta, $label) {
                Gold::create(['amount' => $delta, 'description' => $label]);
                GoldLog::create(['type' => 'add', 'amount' => $delta, 'description' => $label]);
            });
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
