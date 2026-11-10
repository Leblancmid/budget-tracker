<?php

namespace App\Services\Undo;

use App\Models\Operation;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Throwable;

/**
 * Records every row one action creates, changes or deletes, exactly as stored in the database
 * (before and after), so Master File → Undo can put it all back. An action is one request that
 * changes data (RecordOperation middleware) or one scheduled job (run()).
 *
 * It listens to every model's events, and also captures what the database does on its own when
 * a row is deleted (ON DELETE CASCADE / SET NULL), which the app never sees.
 */
class OperationRecorder
{
    /** Never journaled: logs, the journal itself, logins and framework tables. */
    private const SKIP = [
        'activity_logs', 'operations', 'operation_changes', 'personal_access_tokens', 'users',
        'password_reset_tokens', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 'migrations',
    ];

    /** @var list<array{table_name: string, row_id: int, action: string, before: ?array, after: ?array}>|null */
    private static ?array $buffer = null;

    /** Rows as they were just before an update, until the update finishes. */
    private static array $before = [];

    public static function register(): void
    {
        Event::listen('eloquent.created: *', fn (string $e, array $d) => self::created($d[0]));
        Event::listen('eloquent.updating: *', fn (string $e, array $d) => self::updating($d[0]));
        Event::listen('eloquent.updated: *', fn (string $e, array $d) => self::updated($d[0]));
        Event::listen('eloquent.deleting: *', fn (string $e, array $d) => self::deleting($d[0]));
    }

    public static function begin(): void
    {
        self::$buffer = [];
        self::$before = [];
    }

    public static function recording(): bool
    {
        return self::$buffer !== null;
    }

    /** What's been recorded so far (to name the operation before saving it). */
    public static function pending(): array
    {
        return self::$buffer ?? [];
    }

    public static function discard(): void
    {
        self::$buffer = null;
        self::$before = [];
    }

    /** Save what was recorded as one operation; nothing is saved when nothing changed. */
    public static function finish(?int $userId, string $label, ?string $route): ?Operation
    {
        $changes = self::$buffer ?? [];
        self::discard();
        if ($changes === []) {
            return null;
        }

        return self::store($userId, $label, $route, $changes);
    }

    /** Run a job (e.g. the scheduler posting recurring entries) as one undoable operation. */
    public static function run(string $label, Closure $job, ?int $userId = null): mixed
    {
        if (self::recording()) {
            return $job(); // already inside one
        }
        self::begin();
        try {
            $result = $job();
        } catch (Throwable $e) {
            self::discard();
            throw $e;
        }
        self::finish($userId, $label, null);

        return $result;
    }

    /** A save that skips model events (saveQuietly): record it by hand. */
    public static function quietly(Model $model, Closure $save): void
    {
        $before = self::tracks($model) ? self::row($model->getTable(), $model->getKey()) : null;
        $save();
        if ($before !== null) {
            self::push($model->getTable(), $model->getKey(), 'updated', $before, self::row($model->getTable(), $model->getKey()));
        }
    }

    /**
     * A bulk update (query()->update(), increment…) skips model events: record each row it
     * touches by hand. $ids are the rows the update matches, read before it runs.
     */
    public static function bulkUpdate(string $table, array $ids, Closure $run): mixed
    {
        if (self::$buffer === null || in_array($table, self::SKIP, true) || $ids === []) {
            return $run();
        }
        $before = DB::table($table)->whereIn('id', $ids)->get()->keyBy('id');
        $result = $run();
        foreach (DB::table($table)->whereIn('id', $ids)->get() as $after) {
            if (isset($before[$after->id])) {
                self::push($table, $after->id, 'updated', (array) $before[$after->id], (array) $after);
            }
        }

        return $result;
    }

    /** A bulk delete skips model events: record each row (and what the database removes with it). */
    public static function bulkDelete(string $table, array $ids): void
    {
        if (self::$buffer === null || in_array($table, self::SKIP, true)) {
            return;
        }
        foreach (DB::table($table)->whereIn('id', $ids)->get() as $row) {
            self::cascades($table, $row->id);
            self::push($table, $row->id, 'deleted', (array) $row, null);
        }
    }

    /**
     * Write an operation and its changes. Also used for undos, whose changes are built by hand.
     *
     * @param  list<array{table_name: string, row_id: int, action: string, before: ?array, after: ?array}>  $changes
     */
    public static function store(?int $userId, string $label, ?string $route, array $changes, array $extra = []): Operation
    {
        $op = Operation::create(['user_id' => $userId, 'label' => mb_substr($label, 0, 160), 'route' => $route, ...$extra]);
        foreach (array_chunk($changes, 200) as $chunk) {
            DB::table('operation_changes')->insert(array_map(fn ($c) => [
                'operation_id' => $op->id,
                'table_name'   => $c['table_name'],
                'row_id'       => $c['row_id'],
                'action'       => $c['action'],
                'before'       => $c['before'] === null ? null : json_encode($c['before']),
                'after'        => $c['after'] === null ? null : json_encode($c['after']),
            ], $chunk));
        }

        return $op;
    }

    /** The row exactly as the database stores it. */
    public static function row(string $table, int|string|null $id): ?array
    {
        if ($id === null) {
            return null;
        }
        $row = DB::table($table)->where('id', $id)->first();

        return $row ? (array) $row : null;
    }

    private static function tracks(Model $model): bool
    {
        return self::$buffer !== null && ! in_array($model->getTable(), self::SKIP, true) && $model->getKeyName() === 'id';
    }

    private static function push(string $table, int|string $id, string $action, ?array $before, ?array $after): void
    {
        if ($action === 'updated' && $before == $after) {
            return; // nothing really changed
        }
        self::$buffer[] = ['table_name' => $table, 'row_id' => (int) $id, 'action' => $action, 'before' => $before, 'after' => $after];
    }

    private static function created(Model $model): void
    {
        if (self::tracks($model)) {
            self::push($model->getTable(), $model->getKey(), 'created', null, self::row($model->getTable(), $model->getKey()));
        }
    }

    private static function updating(Model $model): void
    {
        if (self::tracks($model)) {
            self::$before[$model->getTable() . '#' . $model->getKey()] = self::row($model->getTable(), $model->getKey());
        }
    }

    private static function updated(Model $model): void
    {
        if (! self::tracks($model)) {
            return;
        }
        $key = $model->getTable() . '#' . $model->getKey();
        $before = self::$before[$key] ?? null;
        unset(self::$before[$key]);
        if ($before !== null) {
            self::push($model->getTable(), $model->getKey(), 'updated', $before, self::row($model->getTable(), $model->getKey()));
        }
    }

    private static function deleting(Model $model): void
    {
        if (! self::tracks($model)) {
            return;
        }
        $before = self::row($model->getTable(), $model->getKey());
        if ($before === null) {
            return;
        }
        // What the database will remove or unlink by itself, recorded first so an undo puts the
        // parent back before them
        self::cascades($model->getTable(), $model->getKey());
        self::push($model->getTable(), $model->getKey(), 'deleted', $before, null);
    }

    /** Rows the database deletes (CASCADE) or unlinks (SET NULL) when this row is deleted. */
    private static function cascades(string $table, int|string $id, int $depth = 0): void
    {
        if ($depth > 10) {
            return;
        }
        foreach (ForeignKeys::pointingAt($table) as $fk) {
            if (in_array($fk['table'], self::SKIP, true) || ! in_array($fk['rule'], ['CASCADE', 'SET NULL'], true)) {
                continue;
            }
            foreach (DB::table($fk['table'])->where($fk['column'], $id)->get() as $child) {
                $child = (array) $child;
                if ($fk['rule'] === 'CASCADE') {
                    self::cascades($fk['table'], $child['id'], $depth + 1);
                    self::push($fk['table'], $child['id'], 'deleted', $child, null);
                } else {
                    self::push($fk['table'], $child['id'], 'updated', $child, [...$child, $fk['column'] => null]);
                }
            }
        }
    }
}
