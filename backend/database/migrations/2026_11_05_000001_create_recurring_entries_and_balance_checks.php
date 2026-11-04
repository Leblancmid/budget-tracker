<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Recurring daily transactions (bills, allowances) posted automatically, and the last
 * bank check of each Balance account (the real balance it was matched to).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('type', 10);                 // income | expense
            $table->string('scope', 10)->default('personal');
            $table->decimal('amount', 12, 2);
            $table->string('description')->nullable();
            $table->string('balance_account', 50)->nullable();
            $table->string('frequency', 10);            // daily | weekly | monthly
            $table->unsignedTinyInteger('day_of_month')->nullable(); // monthly: 1–31, clamped to short months
            $table->date('next_date')->index();
            $table->boolean('active')->default(true)->index();
            $table->date('last_posted_on')->nullable();
            $table->timestamps();
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('recurring_entry_id')->nullable()->after('category_id')
                ->constrained('recurring_entries')->nullOnDelete();
        });

        Schema::table('balance_accounts', function (Blueprint $table) {
            $table->date('checked_at')->nullable()->after('interest_credited_through');
            $table->decimal('checked_balance', 14, 2)->nullable()->after('checked_at');
        });
    }

    public function down(): void
    {
        Schema::table('balance_accounts', function (Blueprint $table) {
            $table->dropColumn(['checked_at', 'checked_balance']);
        });

        Schema::table('transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('recurring_entry_id');
        });

        Schema::dropIfExists('recurring_entries');
    }
};
