<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('balance_entries', function (Blueprint $table) {
            $table->id();
            $table->enum('account', ['PAYPAL', 'BINANCE']);
            $table->enum('type', ['add', 'sell']);
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
