<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTransactionRequest;
use App\Http\Requests\UpdateTransactionRequest;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with('category')
            ->where('user_id', auth()->id())
            ->latest('date')->latest('id');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
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
        $transaction = Transaction::create(array_merge($request->validated(), ['user_id' => auth()->id()]));

        return response()->json($transaction->load('category'), 201);
    }

    public function show(Transaction $transaction): JsonResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);
        return response()->json($transaction->load('category'));
    }

    public function update(UpdateTransactionRequest $request, Transaction $transaction): JsonResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);
        $transaction->update($request->validated());

        return response()->json($transaction->load('category'));
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        abort_if($transaction->user_id !== auth()->id(), 403);
        $transaction->delete();

        return response()->json(['message' => 'Transaction deleted successfully.']);
    }
}
