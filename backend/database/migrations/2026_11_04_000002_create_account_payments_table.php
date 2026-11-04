<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Payments toward an account's cost. Each keeps its own rates, so an account bought with
     * gold from several trades (or cash) gets its exact ₱ cost.
     *   gold_trade: gold taken out of a gold trade; `taken` records exactly what was taken
     *               (gold, ₱, stash) so removing the payment can put it all back.
     *   cash:       money from a Balance wallet; `balance_entry_id` is the deduction.
     */
    public function up(): void
    {
        Schema::create('account_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('rucoy_accounts')->cascadeOnDelete();
            $table->string('method', 20);
            $table->decimal('gold', 20, 0);
            $table->decimal('cost_php', 15, 2);
            $table->decimal('cost_rate', 10, 6)->nullable();
            $table->decimal('cost_php_rate', 10, 4)->nullable();

            $table->foreignId('source_trade_id')->nullable()->constrained('business_transactions')->nullOnDelete();
            $table->json('taken')->nullable();

            $table->foreignId('balance_entry_id')->nullable()->constrained('balance_entries')->nullOnDelete();
            $table->string('balance_account', 50)->nullable();
            $table->decimal('cash_amount', 15, 2)->nullable();
            $table->string('currency', 3)->nullable();

            $table->date('date');
            $table->string('note')->nullable();
            $table->timestamps();

            $table->index(['account_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_payments');
    }
};
