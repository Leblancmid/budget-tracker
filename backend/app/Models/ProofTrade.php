<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One of your best trades, shown on the website as proof, with its screenshots. */
class ProofTrade extends Model
{
    public const CURRENCIES = ['EUR', 'USD', 'PHP'];

    protected $fillable = ['title', 'value', 'currency', 'traded_on', 'quote', 'quote_by', 'published'];

    protected function casts(): array
    {
        return ['value' => 'float', 'traded_on' => 'date:Y-m-d', 'published' => 'boolean'];
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProofImage::class)->orderBy('sort_order')->orderBy('id');
    }
}
