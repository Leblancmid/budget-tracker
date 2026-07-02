<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class BusinessTransaction extends Model
{
    protected $fillable = ['type', 'action', 'amount', 'description', 'date', 'notes'];

    protected $casts = [
        'amount' => 'decimal:2',
        'date'   => 'date:Y-m-d',
    ];

    public function scopeIncome(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('action', 'sell')
              ->orWhere(function ($q2) {
                  $q2->whereNull('action')->where('type', '!=', 'expense');
              });
        });
    }

    public function scopeExpense(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->where('action', 'buy')
              ->orWhere(function ($q2) {
                  $q2->whereNull('action')->where('type', 'expense');
              });
        });
    }

    public static function incomeExpr(): string
    {
        return "CASE WHEN action = 'sell' OR (action IS NULL AND type != 'expense') THEN 'income' ELSE 'expense' END";
    }
}
