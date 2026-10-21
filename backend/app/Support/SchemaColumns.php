<?php

namespace App\Support;

use Illuminate\Support\Facades\Schema;

/**
 * Cached column checks for optional columns that older databases may not have yet,
 * so each one hits the database once per process instead of on every call.
 */
class SchemaColumns
{
    /** @var array<string, bool> */
    private static array $cache = [];

    public static function has(string $table, string $column): bool
    {
        return self::$cache["{$table}.{$column}"] ??= Schema::hasColumn($table, $column);
    }
}
