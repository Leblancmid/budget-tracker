<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Money in and out of each Balance account. An entry can belong to a daily transaction, a gold
 * purchase paid from a wallet (nullOnDelete: the money was really spent) or a transfer.
 * kind: 'interest' for daily interest credits, null otherwise.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('balance_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transaction_id')->nullable()->unique()->constrained('transactions')->cascadeOnDelete();
            $table->foreignId('business_transaction_id')->nullable()->constrained('business_transactions')->nullOnDelete();
            $table->foreignId('balance_transfer_id')->nullable()->constrained('balance_transfers')->cascadeOnDelete();
            $table->string('account', 50); // balance_accounts.code
            $table->enum('type', ['add', 'sell']);
            $table->string('kind', 20)->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('description')->nullable();
            $table->date('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('balance_entries');
    }
};
