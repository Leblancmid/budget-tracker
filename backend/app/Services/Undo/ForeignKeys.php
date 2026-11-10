<?php

namespace App\Services\Undo;

use Illuminate\Support\Facades\DB;

/**
 * The database's own foreign keys, read once per request: which tables point at a table, and
 * what happens to them when a row is deleted (CASCADE removes them, SET NULL clears the link).
 * The database does these itself, so the app never sees them; the undo journal has to.
 */
class ForeignKeys
{
    /** @var array<string, list<array{table: string, column: string, rule: string}>>|null */
    private static ?array $byParent = null;

    /** @return list<array{table: string, column: string, rule: string}> */
    public static function pointingAt(string $table): array
    {
        if (self::$byParent === null) {
            self::$byParent = [];
            $rows = DB::select(
                'SELECT k.TABLE_NAME AS child, k.COLUMN_NAME AS col, k.REFERENCED_TABLE_NAME AS parent, r.DELETE_RULE AS rule
                 FROM information_schema.KEY_COLUMN_USAGE k
                 JOIN information_schema.REFERENTIAL_CONSTRAINTS r
                   ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
                 WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL'
            );
            foreach ($rows as $r) {
                self::$byParent[$r->parent][] = ['table' => $r->child, 'column' => $r->col, 'rule' => $r->rule];
            }
        }

        return self::$byParent[$table] ?? [];
    }

    /** Forget what was read (after a migration in tests). */
    public static function flush(): void
    {
        self::$byParent = null;
    }
}
