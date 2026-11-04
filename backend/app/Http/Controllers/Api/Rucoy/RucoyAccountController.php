<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\Rucoy\StoreRucoyAccountRequest;
use App\Http\Requests\Rucoy\UpdateRucoyAccountRequest;
use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Models\RucoyAccount;
use App\Services\GoldInventory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RucoyAccountController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(RucoyAccount::active()->with('payments')->latest()->get()->map(fn ($a) => $this->transform($a)));
    }

    public function archived(): JsonResponse
    {
        return response()->json(RucoyAccount::archived()->with('payments')->latest('archived_at')->get()->map(fn ($a) => $this->transform($a)));
    }

    /** Mark the account sold: archive its business transactions and add its price to the stash. */
    public function archive(RucoyAccount $rucoyAccount): JsonResponse
    {
        DB::transaction(function () use ($rucoyAccount) {
            $now = now();
            $rucoyAccount->archived_at = $now;
            $rucoyAccount->save();

            BusinessTransaction::where('account_id', $rucoyAccount->id)
                ->active()
                ->update(['archived_at' => $now]);

            if ($rucoyAccount->price) {
                GoldInventory::record($rucoyAccount->price, $this->soldLabel($rucoyAccount));
            }
        });

        return response()->json($this->transform($rucoyAccount->fresh()));
    }

    /** Undo a sale: restore its business transactions and take its gold back out. */
    public function unarchive(RucoyAccount $rucoyAccount): JsonResponse
    {
        DB::transaction(function () use ($rucoyAccount) {
            $rucoyAccount->archived_at = null;
            $rucoyAccount->save();

            BusinessTransaction::where('account_id', $rucoyAccount->id)
                ->archived()
                ->update(['archived_at' => null]);

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
        $data = $this->withScreenshot($this->normalizeAccessories($request->validated()), $request, $rucoyAccount);

        if ($request->hasFile('avatar')) {
            if ($rucoyAccount->avatar) {
                Storage::disk('public')->delete($rucoyAccount->avatar);
            }
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $rucoyAccount->update($data);

        return response()->json($this->transform($rucoyAccount->fresh()));
    }

    public function destroy(RucoyAccount $rucoyAccount): JsonResponse
    {
        foreach ([$rucoyAccount->avatar, $rucoyAccount->screenshot] as $file) {
            if ($file) {
                Storage::disk('public')->delete($file);
            }
        }

        $rucoyAccount->delete();

        return response()->json(['message' => 'Account deleted.']);
    }

    private function soldLabel(RucoyAccount $account): string
    {
        return 'Sold: ' . $account->description;
    }

    /** No accessories is stored as null; duplicates are dropped. */
    private function normalizeAccessories(array $data): array
    {
        if (array_key_exists('accessories', $data)) {
            $data['accessories'] = $data['accessories'] ? array_values(array_unique($data['accessories'])) : null;
        }

        return $data;
    }

    /**
     * Store an uploaded screenshot (under a generated name) or clear it on request,
     * removing the file it replaces. Returns the data to save.
     */
    private function withScreenshot(array $data, Request $request, ?RucoyAccount $account = null): array
    {
        $remove = (bool) ($data['remove_screenshot'] ?? false);
        unset($data['remove_screenshot'], $data['screenshot']);

        if ($request->hasFile('screenshot') || $remove) {
            if ($account?->screenshot) {
                Storage::disk('public')->delete($account->screenshot);
            }
            $data['screenshot'] = $request->hasFile('screenshot')
                ? $request->file('screenshot')->store('screenshots', 'public')
                : null;
        }

        return $data;
    }

    private function transform(RucoyAccount $account): array
    {
        $account->loadMissing('payments');

        return [
            ...$account->toArray(),
            // Paid toward the cost so far, from its payments (gold and exact ₱)
            'paid_gold'     => (float) $account->payments->sum('gold'),
            'paid_cost_php' => round((float) $account->payments->sum('cost_php'), 2),
            'avatar' => $account->avatar
                ? asset('storage/' . $account->avatar)
                : null,
            'screenshot' => $account->screenshot
                ? asset('storage/' . $account->screenshot)
                : null,
        ];
    }
}
