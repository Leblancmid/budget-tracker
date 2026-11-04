<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreBalanceTransferRequest;
use App\Models\BalanceTransfer;
use App\Services\BalanceTransferService;
use Illuminate\Http\JsonResponse;

class BalanceTransferController extends Controller
{
    public function __construct(private readonly BalanceTransferService $transfers) {}

    public function store(StoreBalanceTransferRequest $request): JsonResponse
    {
        return response()->json($this->transfers->create($request->validated()), 201);
    }

    /** Undo a transfer: the money goes back to where it came from. */
    public function destroy(BalanceTransfer $balanceTransfer): JsonResponse
    {
        $this->transfers->delete($balanceTransfer);

        return response()->json(['message' => 'Transfer undone.']);
    }
}
