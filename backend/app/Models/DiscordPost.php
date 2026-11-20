<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One Listing Kit image sent to one Discord channel, or a skipped auto-post (no channel). */
class DiscordPost extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['kind', 'slot_date', 'slot', 'channel_key', 'channel_no', 'ok', 'status', 'note'];

    protected function casts(): array
    {
        return ['ok' => 'boolean', 'slot_date' => 'date:Y-m-d'];
    }
}
