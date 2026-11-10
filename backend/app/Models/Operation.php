<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One thing done in the app, with every row it changed (see App\Services\Undo). */
class Operation extends Model
{
    protected $fillable = ['user_id', 'label', 'route', 'kind', 'reverts_id', 'undone_by_id', 'undone_at'];

    protected function casts(): array
    {
        return ['undone_at' => 'datetime'];
    }

    public function changes(): HasMany
    {
        return $this->hasMany(OperationChange::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reverts(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reverts_id');
    }
}
