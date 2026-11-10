<?php

namespace App\Models\Concerns;

use App\Services\Undo\OperationRecorder;
use Illuminate\Database\Eloquent\Builder;

/**
 * The query builder of every app model. Bulk updates and deletes (Model::where(...)->update(),
 * ->delete(), ->increment()) skip model events; this records the rows they touch so they can be
 * undone like everything else (Master File → Undo).
 */
class JournaledBuilder extends Builder
{
    public function update(array $values)
    {
        return OperationRecorder::bulkUpdate($this->model->getTable(), $this->matchingIds(), fn () => parent::update($values));
    }

    public function increment($column, $amount = 1, array $extra = [])
    {
        return OperationRecorder::bulkUpdate($this->model->getTable(), $this->matchingIds(), fn () => parent::increment($column, $amount, $extra));
    }

    public function decrement($column, $amount = 1, array $extra = [])
    {
        return OperationRecorder::bulkUpdate($this->model->getTable(), $this->matchingIds(), fn () => parent::decrement($column, $amount, $extra));
    }

    public function delete()
    {
        $ids = $this->matchingIds();
        if ($ids !== []) {
            OperationRecorder::bulkDelete($this->model->getTable(), $ids);
        }

        return parent::delete();
    }

    /**
     * IDs of the rows this query would change (only read while recording). A model saving or
     * deleting itself also runs through here, but its own events already record it: skip that
     * (its builder is bound to that existing record; a bulk query's is a fresh, unsaved one).
     */
    private function matchingIds(): array
    {
        if (! OperationRecorder::recording() || $this->model->exists) {
            return [];
        }

        return (clone $this)->pluck($this->model->getQualifiedKeyName())->all();
    }
}
