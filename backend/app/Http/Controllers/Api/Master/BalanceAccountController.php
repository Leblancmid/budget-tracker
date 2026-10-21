<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\ReorderBalanceAccountsRequest;
use App\Http\Requests\Master\StoreBalanceAccountRequest;
use App\Http\Requests\Master\UpdateBalanceAccountRequest;
use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class BalanceAccountController extends Controller
{
    public function index(): JsonResponse
    {
        $totals = BalanceEntry::selectRaw("account, count(*) as c, SUM(CASE WHEN type = 'add' THEN amount ELSE -amount END) as balance")
            ->groupBy('account')->get()->keyBy('account');

        return response()->json(
            BalanceAccount::orderBy('sort_order')->orderBy('id')->get()
                ->map(fn ($a) => [
                    ...$a->toArray(),
                    'entry_count' => (int) ($totals[$a->code]->c ?? 0),
                    'balance'     => round((float) ($totals[$a->code]->balance ?? 0), 2),
                ])
        );
    }

    public function store(StoreBalanceAccountRequest $request): JsonResponse
    {
        $data = $request->validated();

        $account = BalanceAccount::create([
            ...$data,
            'code'       => $this->uniqueCode($data['name']),
            'sort_order' => (int) BalanceAccount::max('sort_order') + 1,
        ]);

        return response()->json([...$account->toArray(), 'entry_count' => 0], 201);
    }

    public function update(UpdateBalanceAccountRequest $request, BalanceAccount $balanceAccount): JsonResponse
    {
        $data = $request->validated();

        if (array_key_exists('hidden', $data)) {
            $data['hidden_at'] = $data['hidden'] ? ($balanceAccount->hidden_at ?? now()) : null;
            unset($data['hidden']);
        }

        // The code is the link to existing entries, so it never changes on rename
        $balanceAccount->update($data);

        return response()->json([...$balanceAccount->fresh()->toArray(), 'entry_count' => $balanceAccount->entries()->count()]);
    }

    /** Save a new order: { ids: [3, 1, 2, ...] } */
    public function reorder(ReorderBalanceAccountsRequest $request): JsonResponse
    {
        foreach (array_values($request->validated('ids')) as $i => $id) {
            BalanceAccount::whereKey($id)->update(['sort_order' => $i + 1]);
        }

        return $this->index();
    }

    public function destroy(BalanceAccount $balanceAccount): JsonResponse
    {
        if ($balanceAccount->entries()->exists()) {
            return response()->json(['message' => 'This account has entries — hide it instead, or delete its entries first.'], 422);
        }
        $balanceAccount->delete();

        return response()->json(['message' => 'Account deleted.']);
    }

    private function uniqueCode(string $name): string
    {
        $base = Str::upper(Str::limit(Str::slug($name, '_'), 40, '')) ?: 'ACCOUNT';
        $code = $base;
        for ($i = 2; BalanceAccount::where('code', $code)->exists(); $i++) {
            $code = $base . '_' . $i;
        }

        return $code;
    }
}
