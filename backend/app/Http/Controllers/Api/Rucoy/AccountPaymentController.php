<?php

namespace App\Http\Controllers\Api\Rucoy;

use App\Http\Controllers\Controller;
use App\Http\Requests\Rucoy\StoreAccountPaymentRequest;
use App\Models\AccountPayment;
use App\Models\RucoyAccount;
use App\Services\AccountPaymentService;
use Illuminate\Http\JsonResponse;

class AccountPaymentController extends Controller
{
    public function __construct(private readonly AccountPaymentService $payments) {}

    public function store(StoreAccountPaymentRequest $request, RucoyAccount $rucoyAccount): JsonResponse
    {
        $payment = $this->payments->add($rucoyAccount, $request->validated());

        return response()->json($payment->fresh(), 201);
    }

    public function destroy(RucoyAccount $rucoyAccount, AccountPayment $payment): JsonResponse
    {
        $this->payments->remove($payment);

        return response()->json(['message' => 'Payment removed.']);
    }
}
