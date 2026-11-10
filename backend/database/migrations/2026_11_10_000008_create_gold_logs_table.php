<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * History of gold stash changes. undo: what Undo should reverse beyond the stash, e.g.
 * {"kind": "trade_sale", "sold_id": 12, "remaining_id": 9, "gold": 540000000}.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gold_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['add', 'sell', 'fee']);
            $table->decimal('amount', 15, 2);
            $table->string('description')->nullable();
            $table->json('undo')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gold_logs');
    }
};
