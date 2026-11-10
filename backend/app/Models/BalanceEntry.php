<?php

namespace App\Models;

use App\Models\Concerns\Journaled;
use Illuminate\Database\Eloquent\Model;

class BalanceEntry extends Model
{
    use Journaled;

    protected $fillable = [
        'transaction_id',
        'business_transaction_id',
        'balance_transfer_id',
        'kind',
        'account',
        'type',
        'description',
        'amount',
        'date',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date'   => 'date:Y-m-d',
        ];
    }
}
