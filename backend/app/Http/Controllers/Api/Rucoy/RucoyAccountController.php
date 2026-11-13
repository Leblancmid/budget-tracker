<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\MarkSoldRequest;
use App\Http\Requests\Rucoy\StoreRucoyAccountRequest;
use App\Http\Requests\Rucoy\UpdateRucoyAccountRequest;
use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Models\RucoyAccount;
use App\Services\BusinessTransactionService;
use App\Services\GoldInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RucoyAccountController extends Controller
{
    public function __construct(private readonly BusinessTransactionService $transactions) {}

    public function index(): JsonResponse
    {
        return response()->json(RucoyAccount::active()->with('payments')->latest()->get()->map(fn ($a) => $this->transform($a)));
    }

    public function archived(): JsonResponse
    {
        $accounts = RucoyAccount::archived()->with('payments')->latest('archived_at')->get();
        // Who each was sold to (kept on its sale), in one query
        $buyers = BusinessTransaction::whereIn('account_id', $accounts->pluck('id'))->whereNotNull('sold_to')->pluck('sold_to', 'account_id');

        return response()->json($accounts->map(fn ($a) => $this->transform($a, $buyers[$a->id] ?? null)));
    }

    /** Mark the account sold: archive its business transactions and add its price to the stash. */
    public function archive(MarkSoldRequest $request, RucoyAccount $rucoyAccount): JsonResponse
    {
        $soldTo = trim((string) $request->validated('sold_to')) ?: null;
        DB::transaction(function () use ($rucoyAccount, $soldTo) {
            $now = now();
            $rucoyAccount->archived_at = $now;
            $rucoyAccount->save();

            BusinessTransaction::where('account_id', $rucoyAccount->id)
                ->active()
                ->update(['archived_at' => $now, 'sold_to' => $soldTo]);

            if ($rucoyAccount->price) {
                GoldInventory::record($rucoyAccount->price, $this->soldLabel($rucoyAccount));
            }
        });

        return response()->json($this->transform($rucoyAccount->fresh(), $soldTo));
    }

    /** Undo a sale: restore its business transactions and take its gold back out. */
    public function unarchive(RucoyAccount $rucoyAccount): JsonResponse
    {
        DB::transaction(function () use ($rucoyAccount) {
            $rucoyAccount->archived_at = null;
            $rucoyAccount->save();

            BusinessTransaction::where('account_id', $rucoyAccount->id)
                ->archived()
                ->update(['archived_at' => null, 'sold_to' => null]);

            if ($rucoyAccount->price) {
                $label = $this->soldLabel($rucoyAccount);

                Gold::where('description', $label)
                    ->where('amount', $rucoyAccount->price)
                    ->latest()
                    ->first()
                    ?->delete();

                GoldLog::where('type', 'add')
                    ->where('description', $label)
                    ->where('amount', $rucoyAccount->price)
                    ->latest()
                    ->first()
                    ?->delete();
            }
        });

        return response()->json($this->transform($rucoyAccount->fresh()));
    }

    public function store(StoreRucoyAccountRequest $request): JsonResponse
    {
        $data = $this->withScreenshot($this->normalizeAccessories($request->validated()), $request);

        if ($request->hasFile('avatar')) {
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        // Listed now unless told otherwise; days-to-sell is measured from here
        $data['listed_at'] ??= now();

        $account = RucoyAccount::create($data);

        return response()->json($this->transform($account), 201);
    }

    public function update(UpdateRucoyAccountRequest $request, RucoyAccount $rucoyAccount): JsonResponse
    {
        $data = $this->withScreenshot($this->normalizeAccessories($request->validated()), $request);

        if ($request->hasFile('avatar')) {
            // The old file stays (for Undo); operations:prune removes it once nothing uses it
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $rucoyAccount->update($data);

        // Re-price its Sales row (cash amounts, or the unpaid part of a gold cost, may have changed)
        $tx = BusinessTransaction::where('type', 'account')->where('account_id', $rucoyAccount->id)->first();
        if ($tx) {
            $this->transactions->update($tx, []);
        }

        return response()->json($this->transform($rucoyAccount->fresh()));
    }

    public function destroy(RucoyAccount $rucoyAccount): JsonResponse
    {
        // Its images stay so Undo can bring the account back whole; operations:prune removes them later
        $rucoyAccount->delete();

        return response()->json(['message' => 'Account deleted.']);
    }

    private function soldLabel(RucoyAccount $account): string
    {
        return 'Sold: ' . $account->description;
    }

    /** No accessories is stored as null; duplicates are dropped. A deal is gold or cash, never both. */
    private function normalizeAccessories(array $data): array
    {
        if (($data['deal_type'] ?? null) === 'cash') {
            $data['price'] = null;
            $data['cost']  = null;
        } elseif (($data['deal_type'] ?? null) === 'gold') {
            $data['price_cash']    = null;
            $data['cost_cash']     = null;
            $data['cash_currency'] = null;
        }

        if (array_key_exists('accessories', $data)) {
            $data['accessories'] = $data['accessories'] ? array_values(array_unique($data['accessories'])) : null;
        }

        return $data;
    }

    /**
     * Store an uploaded screenshot (under a generated name) or clear it on request. The file it
     * replaces stays for Undo; operations:prune removes it once nothing uses it. Returns the data to save.
     */
    private function withScreenshot(array $data, Request $request): array
    {
        $remove = (bool) ($data['remove_screenshot'] ?? false);
        unset($data['remove_screenshot'], $data['screenshot']);

        if ($request->hasFile('screenshot') || $remove) {
            $data['screenshot'] = $request->hasFile('screenshot')
                ? $request->file('screenshot')->store('screenshots', 'public')
                : null;
        }

        return $data;
    }

    /** $soldTo: who it was sold to (sold accounts only) */
    private function transform(RucoyAccount $account, ?string $soldTo = null): array
    {
        $account->loadMissing('payments');

        return [
            ...$account->toArray(),
            // Paid toward the cost so far, from its payments (gold and exact ₱)
            'paid_gold'     => (float) $account->payments->sum('gold'),
            'paid_cost_php' => round((float) $account->payments->sum('cost_php'), 2),
            'sold_to'       => $soldTo,
            'avatar' => $account->avatar
                ? asset('storage/' . $account->avatar)
                : null,
            'screenshot' => $account->screenshot
                ? asset('storage/' . $account->screenshot)
                : null,
        ];
    }
}
