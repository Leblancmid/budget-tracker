<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'loggable_type',
        'loggable_id',
        'module',
        'type',
        'description',
        'amount',
        'ip_address',
        'user_agent',
    ];
}
