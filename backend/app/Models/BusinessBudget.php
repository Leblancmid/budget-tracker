<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BusinessBudget extends Model
{
    protected $fillable = ['category_id', 'amount', 'month', 'year'];

    protected $casts = ['amount' => 'decimal:2'];

    public function category()
    {
        return $this->belongsTo(BusinessCategory::class, 'category_id');
    }
}
