<?php

namespace App\Observers;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;

/**
 * Writes an activity log entry when a model is created, and an "edited" entry with the
 * before/after value of each changed field when it's updated.
 */
abstract class ActivityLogObserver
{
    /** Fields whose changes alone don't count as an edit. */
    protected array $ignoredOnEdit = ['updated_at', 'created_at'];

    /** Log archiving (archived_at being set) as its own "archived" entry instead of an edit. */
    protected bool $logsArchive = false;

    /** Module shown on the Logs page, e.g. 'daily'. */
    abstract protected function module(): string;

    public function created(Model $model): void
    {
        ActivityLog::create([...$this->attributes($model), 'type' => $this->type($model)]);
    }

    public function updated(Model $model): void
    {
        if ($this->logsArchive && $model->isDirty('archived_at') && $model->archived_at !== null) {
            ActivityLog::create([...$this->attributes($model), 'type' => 'archived']);
        } elseif ($model->isDirty() && ! $this->onlyIgnoredFieldsChanged($model)) {
            ActivityLog::recordEdit($model, $this->attributes($model));
        }
    }

    protected function type(Model $model): ?string
    {
        return $model->type;
    }

    protected function description(Model $model): ?string
    {
        return $model->description;
    }

    protected function amount(Model $model): mixed
    {
        return $model->amount;
    }

    private function attributes(Model $model): array
    {
        return [
            'user_id'       => auth()->id(),
            'loggable_type' => $model::class,
            'loggable_id'   => $model->id,
            'module'        => $this->module(),
            'description'   => $this->description($model),
            'amount'        => $this->amount($model),
            'ip_address'    => request()->ip(),
            'user_agent'    => request()->userAgent(),
        ];
    }

    private function onlyIgnoredFieldsChanged(Model $model): bool
    {
        $dirty = array_keys($model->getDirty());

        return count($dirty) === count(array_intersect($dirty, $this->ignoredOnEdit));
    }
}
