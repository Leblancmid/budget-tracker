<?php

namespace App\Models;

use App\Support\SchemaColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id',
        'loggable_type',
        'loggable_id',
        'module',
        'type',
        'description',
        'amount',
        'changes',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'changes' => 'array',
        ];
    }

    /** Fields never shown in an edit diff. */
    private const IGNORED_FIELDS = ['updated_at', 'created_at'];

    /** Edit logs written during this request, keyed by model, so repeated saves merge into one entry. */
    private static array $editsThisRequest = [];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record an "edited" entry for an updated model, including the before/after
     * value of every changed field. Call from an observer's `updated` hook.
     */
    public static function recordEdit(Model $model, array $attributes, array $ignore = []): void
    {
        // A save right after creation (e.g. computed values) is part of the create, not an edit
        if ($model->wasRecentlyCreated) {
            return;
        }

        $changes = self::diff($model, $ignore);
        if (empty($changes)) {
            return;
        }

        $key = get_class($model) . '|' . $model->getKey();

        if (isset(self::$editsThisRequest[$key])) {
            $log    = self::$editsThisRequest[$key];
            // getAttribute(): inside this class `$log->changes` would hit Eloquent's own protected $changes property
            $merged = $log->getAttribute('changes') ?? [];
            foreach ($changes as $field => $change) {
                $merged[$field] = ['before' => $merged[$field]['before'] ?? $change['before'], 'after' => $change['after']];
                if (self::same($merged[$field]['before'], $merged[$field]['after'])) {
                    unset($merged[$field]);
                }
            }
            $log->update(['changes' => $merged] + array_intersect_key($attributes, array_flip(['description', 'amount'])));

            return;
        }

        if (! self::hasChangesColumn()) {
            $changes = null;
        }

        self::$editsThisRequest[$key] = self::create(array_merge($attributes, [
            'type'    => 'edited',
            'changes' => $changes,
        ]));
    }

    /** @return array<string, array{before: mixed, after: mixed}> */
    private static function diff(Model $model, array $ignore): array
    {
        $ignore = array_merge(self::IGNORED_FIELDS, $ignore);
        $out    = [];
        foreach ($model->getChanges() as $field => $after) {
            if (in_array($field, $ignore, true)) {
                continue;
            }
            $before = $model->getRawOriginal($field);
            if (self::same($before, $after)) {
                continue;
            }
            $out[$field] = ['before' => $before, 'after' => $after];
        }

        return $out;
    }

    /** Treat 6513 and "6513.00" as the same value. */
    private static function same(mixed $a, mixed $b): bool
    {
        if (is_numeric($a) && is_numeric($b)) {
            return (float) $a === (float) $b;
        }

        return (string) $a === (string) $b;
    }

    private static function hasChangesColumn(): bool
    {
        return SchemaColumns::has('activity_logs', 'changes');
    }
}
