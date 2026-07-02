<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRucoyAccountRequest;
use App\Http\Requests\UpdateRucoyAccountRequest;
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
        $rucoyAccount->archived_at = now();
        $rucoyAccount->save();

        return response()->json($this->transform($rucoyAccount->fresh()));
    }

    public function unarchive(RucoyAccount $rucoyAccount): JsonResponse
    {
        $rucoyAccount->archived_at = null;
        $rucoyAccount->save();

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
                ? Storage::disk('public')->url($account->avatar)
                : null,
        ];
    }
}
