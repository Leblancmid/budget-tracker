<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class BusinessTransaction extends Model
{
    protected $fillable = ['type', 'action', 'account_id', 'price_rate', 'cost_rate', 'php_rate', 'price_php', 'cost_php', 'profit_php', 'amount', 'description', 'date', 'notes', 'archived_at'];

    protected $casts = [
        'amount'     => 'decimal:2',
        'price_rate' => 'decimal:6',
        'cost_rate'  => 'decimal:6',
        'php_rate'   => 'decimal:4',
        'price_php'  => 'decimal:2',
        'cost_php'   => 'decimal:2',
        'profit_php' => 'decimal:2',
        'date'       => 'date:Y-m-d',
        'archived_at'=> 'datetime',
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
