<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Money moved between two Balance accounts; its entries (out, fee, in) belong to it. */
class BalanceTransfer extends Model
{
    protected $fillable = ['from_account', 'to_account', 'amount', 'received', 'fee', 'date', 'note'];

    protected function casts(): array
    {
        return [
            'amount'   => 'decimal:2',
            'received' => 'decimal:2',
            'fee'      => 'decimal:2',
            'date'     => 'date:Y-m-d',
        ];
    }

    public function entries(): HasMany
    {
        return $this->hasMany(BalanceEntry::class);
    }
}
