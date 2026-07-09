<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRucoyAccountRequest;
use App\Http\Requests\UpdateRucoyAccountRequest;
use App\Models\BusinessTransaction;
use App\Models\Gold;
use App\Models\GoldLog;
use App\Models\RucoyAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class RucoyAccountController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(RucoyAccount::whereNull('archived_at')->latest()->get()->map(fn ($a) => $this->transform($a)));
    }

    public function archived(): JsonResponse
    {
        return response()->json(RucoyAccount::whereNotNull('archived_at')->latest('archived_at')->get()->map(fn ($a) => $this->transform($a)));
    }

    public function archive(RucoyAccount $rucoyAccount): JsonResponse
    {
        $now = now();
        $rucoyAccount->archived_at = $now;
        $rucoyAccount->save();

        BusinessTransaction::where('account_id', $rucoyAccount->id)
            ->whereNull('archived_at')
            ->update(['archived_at' => $now]);

        if ($rucoyAccount->price) {
            Gold::create([
                'amount'      => $rucoyAccount->price,
                'description' => 'Sold: ' . $rucoyAccount->email,
            ]);

            GoldLog::create([
                'type'        => 'add',
                'amount'      => $rucoyAccount->price,
                'description' => 'Sold: ' . $rucoyAccount->email,
            ]);
        }

        return response()->json($this->transform($rucoyAccount->fresh()));
    }

    public function unarchive(RucoyAccount $rucoyAccount): JsonResponse
    {
        $rucoyAccount->archived_at = null;
        $rucoyAccount->save();

        BusinessTransaction::where('account_id', $rucoyAccount->id)
            ->whereNotNull('archived_at')
            ->update(['archived_at' => null]);

        if ($rucoyAccount->price) {
            Gold::where('description', 'Sold: ' . $rucoyAccount->email)
                ->where('amount', $rucoyAccount->price)
                ->latest()
                ->first()
                ?->delete();

            GoldLog::where('type', 'add')
                ->where('description', 'Sold: ' . $rucoyAccount->email)
                ->where('amount', $rucoyAccount->price)
                ->latest()
                ->first()
                ?->delete();
        }

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
