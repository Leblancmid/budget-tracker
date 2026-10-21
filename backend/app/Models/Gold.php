<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Gold extends Model
{
    use HasFactory;

    protected $table = 'golds';

    protected $fillable = ['amount', 'description'];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function trades(): HasMany
    {
        return $this->hasMany(Trade::class);
    }
}
