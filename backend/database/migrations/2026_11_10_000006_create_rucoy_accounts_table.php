<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Rucoy accounts bought and sold. Priced in gold (price/cost in G) or cash (price_cash/cost_cash
 * in cash_currency). The listing fields are what a buyer sees; listed_at → archived_at (sold)
 * gives days-to-sell.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rucoy_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->string('email');
            $table->string('deal_type', 10)->default('gold'); // gold | cash
            $table->unsignedSmallInteger('level')->nullable();
            $table->unsignedSmallInteger('melee')->nullable();
            $table->unsignedSmallInteger('distance')->nullable();
            $table->unsignedSmallInteger('magic')->nullable();
            $table->unsignedSmallInteger('defense')->nullable();
            $table->json('accessories')->nullable(); // buff rings/necklaces, decorations
            $table->string('avatar')->nullable();
            $table->string('screenshot')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('cost', 12, 2)->nullable();
            $table->decimal('price_cash', 15, 2)->nullable();
            $table->decimal('cost_cash', 15, 2)->nullable();
            $table->string('cash_currency', 3)->nullable();
            $table->boolean('show_price')->default(false);
            $table->enum('payment_status', ['not_paid', 'partially_paid', 'fully_paid'])->default('not_paid');
            $table->date('payment_date')->nullable();
            $table->timestamp('listed_at')->nullable()->index();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rucoy_accounts');
    }
};
