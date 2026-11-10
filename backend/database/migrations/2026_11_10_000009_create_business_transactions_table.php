<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Business sales and purchases (accounts, gold, expenses) with their rates and ₱ values.
 *   system_key:     app-managed rows that must never be deleted, e.g. the pinned "Middleman Fee" trade
 *   inventory_gold: how much of a gold trade's price has been put into the stash
 *                   (null = predates this tracking, so it's left alone)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->nullable()->constrained('rucoy_accounts')->nullOnDelete();
            $table->enum('type', ['account', 'gold', 'expense']);
            $table->string('system_key', 50)->nullable()->unique();
            $table->enum('action', ['buy', 'sell'])->nullable();
            $table->decimal('price_rate', 20, 6)->nullable();
            $table->decimal('cost_rate', 20, 6)->nullable();
            $table->decimal('price_gold', 20, 0)->nullable();
            $table->decimal('cost_gold', 20, 0)->nullable();
            $table->decimal('price_gold_received', 20, 0)->nullable();
            $table->decimal('cost_gold_paid', 20, 0)->nullable();
            $table->decimal('inventory_gold', 20, 0)->nullable();
            $table->decimal('php_rate', 10, 4)->nullable();
            $table->decimal('cost_php_rate', 10, 4)->nullable();
            $table->decimal('price_php', 15, 2)->nullable();
            $table->decimal('cost_php', 15, 2)->nullable();
            $table->decimal('profit_php', 15, 2)->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('description')->nullable();
            $table->date('date');
            $table->text('notes')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_transactions');
    }
};
