<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Transfers between two Balance accounts: the money out, an optional fee and the money in are
 * entries linked to one transfer, removed together.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('balance_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('from_account', 50);
            $table->string('to_account', 50);
            $table->decimal('amount', 15, 2);          // sent, in the from account's currency
            $table->decimal('received', 15, 2);        // arrived, in the to account's currency
            $table->decimal('fee', 15, 2)->nullable(); // charged on top, in the from account's currency
            $table->date('date');
            $table->string('note')->nullable();
            $table->timestamps();
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('balance_transfers');
    }
};
