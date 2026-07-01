<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trades', function (Blueprint $table) {
            $table->dropForeign(['gold_id']);
            $table->unsignedBigInteger('gold_id')->nullable()->change();
            $table->string('currency', 3)->nullable()->after('amount');   // USD, EUR, PHP
            $table->string('payment_method')->nullable()->after('currency'); // binance, paypal
            $table->date('start_date')->nullable()->after('payment_method');
            $table->date('completion_date')->nullable()->after('start_date');
        });
    }

    public function down(): void
    {
        Schema::table('trades', function (Blueprint $table) {
            $table->dropColumn(['currency', 'payment_method', 'start_date', 'completion_date']);
            $table->unsignedBigInteger('gold_id')->nullable(false)->change();
            $table->foreign('gold_id')->references('id')->on('golds')->cascadeOnDelete();
        });
    }
};
