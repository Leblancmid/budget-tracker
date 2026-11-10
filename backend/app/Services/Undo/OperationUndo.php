<?php

namespace App\Services\Undo;

use App\Models\Operation;
use App\Models\OperationChange;
use Illuminate\Database\QueryException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Undo one operation: every row it created is removed, every row it changed gets its old values
 * back, and every row it deleted comes back with the same ID. Totals (profit, stash, net worth,
 * balances) are worked out from these rows, so they follow.
 *
 * Safe by default: if anything newer changed the same rows, nothing is touched and the newer
 * operation to undo first is named. The undo is itself an operation, so undoing it is a redo.
 */
class OperationUndo
{
    public static function undo(Operation $op, ?int $userId): Operation
    {
        if ($op->undone_at !== null) {
            throw new RuntimeException('This was already undone.');
        }
        $changes = $op->changes()->orderBy('id')->get();
        if ($changes->isEmpty()) {
            throw new RuntimeException('There is nothing to undo here.');
        }

        self::checkNothingNewerDependsOnIt($op, $changes);

        return DB::transaction(function () use ($op, $changes, $userId) {
            // The journal lists every row involved, including what the database removed or unlinked
            // by itself, so each is put back exactly. With foreign-key checks paused the database
            // doesn't cascade or object while rows are restored in a different order than they
            // were made (e.g. a trade's fee is journaled before the trade). The check above already
            // refused anything that would leave a newer record pointing at nothing.
            DB::statement('SET FOREIGN_KEY_CHECKS = 0');
            try {
                $inverse = [];
                foreach ($changes->reverse() as $c) {
                    try {
                        $inverse[] = self::revert($c);
                    } catch (QueryException $e) {
                        throw new RuntimeException('It can\'t be put back: ' . self::why($e, $c));
                    }
                }
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS = 1');
            }

            $redo = $op->kind === 'undo';
            $undo = OperationRecorder::store($userId, ($redo ? 'Redid: ' : 'Undid: ') . preg_replace('/^Undid: /', '', $op->label),
                null, $inverse, ['kind' => 'undo', 'reverts_id' => $op->id]);
            $op->forceFill(['undone_at' => now(), 'undone_by_id' => $undo->id])->save();

            // Undoing an undo (a redo): the original is done again
            if ($redo && $op->reverts_id) {
                Operation::whereKey($op->reverts_id)->first()?->forceFill(['undone_at' => null, 'undone_by_id' => null])->save();
            }

            return $undo;
        });
    }

    /**
     * Each row must still be exactly as this operation left it, and nothing newer may point at a
     * row the undo would remove. Otherwise say which newer operation to undo first.
     */
    private static function checkNothingNewerDependsOnIt(Operation $op, Collection $changes): void
    {
        $rows = $changes->groupBy(fn ($c) => $c->table_name . '#' . $c->row_id);
        $ours = $rows->keys()->flip();

        foreach ($rows as $list) {
            $first = $list->first();
            $last = $list->last();
            $current = OperationRecorder::row($first->table_name, $first->row_id);

            if ($first->before !== null && $last->after !== null) {
                // Changed (not added or removed): only the fields this operation changed matter, so
                // e.g. interest credited to the same wallet since doesn't block undoing an edit
                $fields = $list->flatMap(fn ($c) => self::changedFields($c->before, $c->after))->unique()->all();
                $ok = $current !== null && self::same(array_intersect_key($current, array_flip($fields)), array_intersect_key($last->after, array_flip($fields)));
            } elseif ($last->after !== null) {
                // Added by this operation: undo removes it, so it must be untouched since
                $ok = self::same(self::withoutStamps($current), self::withoutStamps($last->after));
            } else {
                $ok = $current === null; // removed by this operation: still gone
            }
            if (! $ok) {
                throw new RuntimeException(self::blocked($op, $first->table_name, $first->row_id, $current === null ? 'was deleted' : 'was changed'));
            }

            // A row the undo removes (this operation created it): nothing newer may point at it
            if ($first->before === null && $last->after !== null) {
                foreach (ForeignKeys::pointingAt($first->table_name) as $fk) {
                    $ids = DB::table($fk['table'])->where($fk['column'], $first->row_id)->pluck('id');
                    foreach ($ids as $childId) {
                        if (! isset($ours[$fk['table'] . '#' . $childId]) && isset(OperationLabel::NOUNS[$fk['table']])) {
                            throw new RuntimeException(self::blocked($op, $fk['table'], $childId, 'was added to it'));
                        }
                    }
                }
            }
        }
    }

    /** Put one change back; returns the change that would redo it. */
    private static function revert(OperationChange $c): array
    {
        $t = $c->table_name;
        $id = $c->row_id;
        switch ($c->action) {
            case 'created':
                DB::table($t)->where('id', $id)->delete();

                return ['table_name' => $t, 'row_id' => $id, 'action' => 'deleted', 'before' => $c->after, 'after' => null];
            case 'updated':
                // Only the fields this change made; anything else changed since is kept
                $fields = self::changedFields($c->before, $c->after);
                $now = OperationRecorder::row($t, $id) ?? [];
                $restore = array_intersect_key($c->before, array_flip($fields));
                if ($restore !== []) {
                    DB::table($t)->where('id', $id)->update($restore);
                }

                return ['table_name' => $t, 'row_id' => $id, 'action' => 'updated', 'before' => $now, 'after' => [...$now, ...$restore]];
            default: // deleted
                DB::table($t)->insert($c->before);

                return ['table_name' => $t, 'row_id' => $id, 'action' => 'created', 'before' => null, 'after' => $c->before];
        }
    }

    /** The fields a change really changed (the save time aside). */
    private static function changedFields(?array $before, ?array $after): array
    {
        $fields = [];
        foreach ($after ?? [] as $k => $v) {
            $old = $before[$k] ?? null;
            if ($k !== 'updated_at' && $k !== 'id' && (($old === null) !== ($v === null) || (string) $old !== (string) $v)) {
                $fields[] = $k;
            }
        }

        return $fields;
    }

    private static function withoutStamps(?array $row): ?array
    {
        if ($row === null) {
            return null;
        }
        unset($row['updated_at']);

        return $row;
    }

    /** Same row, value by value (the database gives numbers and text back in the same form). */
    private static function same(?array $current, ?array $expected): bool
    {
        if ($current === null || $expected === null) {
            return $current === $expected;
        }
        foreach ($expected as $k => $v) {
            $now = $current[$k] ?? null;
            if (($v === null) !== ($now === null) || (string) $v !== (string) $now) {
                return false;
            }
        }

        return true;
    }

    /** "“Edited trade X” (Nov 10, 3:42 PM) changed it after this. Undo that first." */
    private static function blocked(Operation $op, string $table, int $rowId, string $what): string
    {
        $noun = OperationLabel::NOUNS[$table] ?? 'record';
        $newer = OperationChange::where('table_name', $table)->where('row_id', $rowId)->where('operation_id', '>', $op->id)
            ->whereHas('operation', fn ($q) => $q->whereNull('undone_at'))
            ->orderByDesc('operation_id')->with('operation')->first()?->operation;

        if ($newer) {
            return "A {$noun} it touched {$what} afterwards by “{$newer->label}” ("
                . $newer->created_at->timezone('Asia/Manila')->format('M j, g:i A') . '). Undo that first.';
        }

        return "A {$noun} it touched {$what} afterwards outside the app's history (e.g. by the scheduler), so it can't be undone safely.";
    }

    private static function why(QueryException $e, OperationChange $c): string
    {
        $noun = OperationLabel::NOUNS[$c->table_name] ?? 'record';

        return str_contains($e->getMessage(), 'Duplicate entry')
            ? "a {$noun} with the same name or code was added since. Rename or remove it, then try again."
            : "the {$noun} conflicts with something added since.";
    }
}
