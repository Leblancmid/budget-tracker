<?php

namespace App\Services;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BalanceTransfer;
use Illuminate\Support\Facades\DB;

/** Moving money between Balance accounts, e.g. Maribank → GCash. */
class BalanceTransferService
{
    /**
     * Out of one account (plus any fee), into the other. Same currency: what arrives is what was
     * sent; across currencies it's the amount received.
     *
     * @param  array{from_account: string, to_account: string, amount: float|string, received?: float|string|null, fee?: float|string|null, date: string, note?: ?string}  $data
     */
    public function create(array $data): BalanceTransfer
    {
        return DB::transaction(function () use ($data) {
            $from = BalanceAccount::where('code', $data['from_account'])->firstOrFail();
            $to   = BalanceAccount::where('code', $data['to_account'])->firstOrFail();

            $amount   = round((float) $data['amount'], 2);
            $received = $from->currency === $to->currency || empty($data['received'])
                ? $amount
                : round((float) $data['received'], 2);
            $fee  = ! empty($data['fee']) && (float) $data['fee'] > 0 ? round((float) $data['fee'], 2) : null;
            $note = trim((string) ($data['note'] ?? ''));
            $with = fn (string $text) => $note !== '' ? "{$text} · {$note}" : $text;

            $transfer = BalanceTransfer::create([
                'from_account' => $from->code,
                'to_account'   => $to->code,
                'amount'       => $amount,
                'received'     => $received,
                'fee'          => $fee,
                'date'         => $data['date'],
                'note'         => $note !== '' ? $note : null,
            ]);

            $entry = fn (string $account, string $type, float $value, string $text) => $transfer->entries()->create([
                'account' => $account, 'type' => $type, 'amount' => $value, 'date' => $data['date'], 'description' => $with($text),
            ]);
            $entry($from->code, 'sell', $amount, "Transfer to {$to->name}");
            if ($fee) {
                $entry($from->code, 'sell', $fee, "Transfer fee (to {$to->name})");
            }
            $entry($to->code, 'add', $received, "Transfer from {$from->name}");

            return $transfer->load('entries');
        });
    }

    /** Undo a transfer: both sides (and the fee) go back. */
    public function delete(BalanceTransfer $transfer): void
    {
        DB::transaction(function () use ($transfer) {
            // One by one so each removal is in the activity log
            $transfer->entries()->get()->each(fn (BalanceEntry $e) => $e->delete());
            $transfer->delete();
        });
    }
}
