<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/** A screenshot of a proven trade: resized WebP plus a thumbnail, on the public disk. */
class ProofImage extends Model
{
    protected $fillable = ['proof_trade_id', 'path', 'thumb_path', 'width', 'height', 'sort_order'];

    protected $appends = ['url', 'thumb_url'];

    protected function casts(): array
    {
        return ['width' => 'integer', 'height' => 'integer', 'sort_order' => 'integer'];
    }

    public function trade(): BelongsTo
    {
        return $this->belongsTo(ProofTrade::class, 'proof_trade_id');
    }

    public function getUrlAttribute(): string
    {
        return '/storage/' . $this->path;
    }

    public function getThumbUrlAttribute(): string
    {
        return '/storage/' . $this->thumb_path;
    }

    /** Remove its files too */
    protected static function booted(): void
    {
        static::deleting(fn (ProofImage $i) => Storage::disk('public')->delete([$i->path, $i->thumb_path]));
    }
}
