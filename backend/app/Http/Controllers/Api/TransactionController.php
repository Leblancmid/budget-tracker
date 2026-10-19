<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['category', 'balanceEntry:id,transaction_id,account'])
            ->where('user_id', auth()->id())
            ->latest('date')->latest('id');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('scope')) {
            $query->where('scope', $request->scope);
        }

        if ($request->filled('balance_account')) {
            $request->balance_account === 'none'
                ? $query->whereDoesntHave('balanceEntry')
                : $query->whereHas('balanceEntry', fn ($q) => $q->where('account', $request->balance_account));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $query->where('description', 'like', '%' . $request->search . '%');
        }

        $perPage = (int) $request->get('per_page', 10);
        $transactions = $query->paginate($perPage);

        return response()->json($transactions);
    }

    public function store(StoreTransactionRequest $request): JsonResponse
    {
        $data = $request->validated();

        $transaction = DB::transaction(function () use ($data) {
            $tx = Transaction::create(array_merge(collect($data)->except('balance_account')->all(), ['user_id' => auth()->id()]));
            $this->syncBalance($tx, $data['balance_account'] ?? null);
            return $tx;
        });

        return response()->json($this->present($transaction), 201);
    }

    public function show(Transaction $transaction): JsonResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);
        return response()->json($this->present($transaction));
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): JsonResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);
        $data = $request->validated();

        DB::transaction(function () use ($transaction, $data) {
            $transaction->update(collect($data)->except('balance_account')->all());
            // Keep the current account unless the request changes (or clears) it
            $account = array_key_exists('balance_account', $data)
                ? $data['balance_account']
                : $transaction->balanceEntry?->account;
            $this->syncBalance($transaction->fresh(), $account);
        });

        return response()->json($this->present($transaction));
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);
        // The linked balance entry is removed with it (cascade), restoring the account balance
        $transaction->balanceEntry?->delete();
        $transaction->delete();

        return response()->json(['message' => 'Transaction deleted successfully.']);
    }

    /**
     * Mirror the transaction into its Balance account: income adds, expense deducts.
     * No account → any previous entry is removed.
     */
    private function syncBalance(Transaction $tx, ?string $account): void
    {
        $entry = $tx->balanceEntry()->first();

        if (!$account) {
            $entry?->delete();
            return;
        }

        $values = [
            'account'     => $account,
            'type'        => $tx->type === 'income' ? 'add' : 'sell',
            'amount'      => $tx->amount,
            'date'        => $tx->date->format('Y-m-d'),
            'description' => $tx->description ?: ($tx->category?->name ?? 'Daily transaction'),
        ];

        $entry ? $entry->update($values) : $tx->balanceEntry()->create($values);
    }

    private function present(Transaction $tx): Transaction
    {
        return $tx->fresh()->load(['category', 'balanceEntry:id,transaction_id,account']);
    }
}
