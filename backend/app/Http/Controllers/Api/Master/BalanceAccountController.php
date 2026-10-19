<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BalanceAccountController extends Controller
{
    public function index(): JsonResponse
    {
        $counts = BalanceEntry::selectRaw('account, count(*) as c')->groupBy('account')->pluck('c', 'account');

        return response()->json(
            BalanceAccount::orderBy('sort_order')->orderBy('id')->get()
                ->map(fn ($a) => [...$a->toArray(), 'entry_count' => (int) ($counts[$a->code] ?? 0)])
        );
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        $account = BalanceAccount::create([
            ...$data,
            'code'       => $this->uniqueCode($data['name']),
            'sort_order' => (int) BalanceAccount::max('sort_order') + 1,
        ]);

        return response()->json([...$account->toArray(), 'entry_count' => 0], 201);
    }

    public function update(Request $request, BalanceAccount $balanceAccount): JsonResponse
    {
        $data = $request->validate([
            ...$this->rules(partial: true),
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'hidden'     => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('hidden', $data)) {
            $data['hidden_at'] = $data['hidden'] ? ($balanceAccount->hidden_at ?? now()) : null;
            unset($data['hidden']);
        }

        // The code is the link to existing entries, so it never changes on rename
        $balanceAccount->update($data);

        return response()->json([...$balanceAccount->fresh()->toArray(), 'entry_count' => $balanceAccount->entries()->count()]);
    }

    /** Save a new order: { ids: [3, 1, 2, ...] } */
    public function reorder(Request $request): JsonResponse
    {
        $ids = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer', 'exists:balance_accounts,id']])['ids'];
        foreach (array_values($ids) as $i => $id) {
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

    private function rules(bool $partial = false): array
    {
        $req = $partial ? 'sometimes' : 'required';
        return [
            'name'     => [$req, 'string', 'max:100'],
            'currency' => [$req, Rule::in(BalanceAccount::CURRENCIES)],
            'color'    => [$req, 'string', 'max:20', 'regex:/^[a-z]+$/'],
            'icon'     => [$req, 'string', 'max:30', 'regex:/^[a-z0-9-]+$/'],
        ];
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
