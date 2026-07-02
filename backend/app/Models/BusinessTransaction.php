<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessTransaction extends Model
{
    protected $fillable = ['category_id', 'type', 'action', 'amount', 'description', 'date', 'notes'];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date:Y-m-d',
    ];

    public function category()
    {
        return $this->belongsTo(BusinessCategory::class, 'category_id');
    }
}
