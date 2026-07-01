<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RucoyAccount extends Model
{
    use HasFactory;

    protected $table = 'rucoy_accounts';

    protected $fillable = ['description', 'email', 'avatar'];
}
