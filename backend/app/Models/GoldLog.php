<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoldLog extends Model
{
    protected $fillable = ['type', 'amount', 'description', 'undo'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            // What Undo reverses beyond the stash, e.g. {kind: trade_sale, sold_id, remaining_id, gold}
            'undo'   => 'array',
        ];
    }
}
