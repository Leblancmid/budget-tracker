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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RucoyAccountController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(RucoyAccount::active()->latest()->get()->map(fn ($a) => $this->transform($a)));
    }

    public function archived(): JsonResponse
    {
        return response()->json(RucoyAccount::archived()->latest('archived_at')->get()->map(fn ($a) => $this->transform($a)));
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
        $data = $request->validated();

        if ($request->hasFile('avatar')) {
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $account = RucoyAccount::create($data);

        return response()->json($this->transform($account), 201);
    }

    public function update(UpdateRucoyAccountRequest $request, RucoyAccount $rucoyAccount): JsonResponse
    {
        $data = $request->validated();

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
        if ($rucoyAccount->avatar) {
            Storage::disk('public')->delete($rucoyAccount->avatar);
        }

        $rucoyAccount->delete();

        return response()->json(['message' => 'Account deleted.']);
    }

    private function soldLabel(RucoyAccount $account): string
    {
        return 'Sold: ' . $account->description;
    }

    private function transform(RucoyAccount $account): array
    {
        return [
            ...$account->toArray(),
            'avatar' => $account->avatar
                ? asset('storage/' . $account->avatar)
                : null,
        ];
    }
}
