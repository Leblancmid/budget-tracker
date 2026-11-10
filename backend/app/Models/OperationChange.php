<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One row an operation created, changed or deleted: the row as stored before and after. */
class OperationChange extends Model
{
    public $timestamps = false;

    protected $fillable = ['operation_id', 'table_name', 'row_id', 'action', 'before', 'after'];

    protected function casts(): array
    {
        return ['before' => 'array', 'after' => 'array'];
    }

    public function operation(): BelongsTo
    {
        return $this->belongsTo(Operation::class);
    }
}
