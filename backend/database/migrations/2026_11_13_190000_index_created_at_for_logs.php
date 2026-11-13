<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Logs page reads each of these newest first, within a time window: an index on created_at
 * keeps that fast as the tables grow (without it, every visit sorts the whole table).
 */
return new class extends Migration
{
    private const TABLES = ['activity_logs', 'transactions', 'business_transactions', 'account_payments', 'savings', 'balance_entries', 'gold_logs', 'trades'];

    public function up(): void
    {
        foreach (self::TABLES as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->index('created_at'));
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $name) {
            Schema::table($name, fn (Blueprint $table) => $table->dropIndex(['created_at']));
        }
    }
};
