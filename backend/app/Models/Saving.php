<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** Legacy savings entries (replaced by Balance). Read-only: kept so their history still shows on the Logs page. */
class Saving extends Model
{
    protected $fillable = [
        'mode_of_payment',
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
