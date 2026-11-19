<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Credit cards as Balance accounts. kind: wallet (money you have) or credit (a card you owe on).
 * A card's balance goes below zero as you spend (what you owe); credit_limit is how far it can go.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('balance_accounts', function (Blueprint $table) {
            $table->string('kind', 10)->default('wallet')->after('currency'); // wallet | credit
            $table->decimal('credit_limit', 14, 2)->nullable()->after('kind');
        });
    }

    public function down(): void
    {
        Schema::table('balance_accounts', function (Blueprint $table) {
            $table->dropColumn(['kind', 'credit_limit']);
        });
    }
};
