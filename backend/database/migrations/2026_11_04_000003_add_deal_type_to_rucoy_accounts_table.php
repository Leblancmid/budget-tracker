<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Accounts are priced either in gold (price/cost in G with rates, as before) or in cash:
     * price_cash/cost_cash in cash_currency (PHP or USD). Existing accounts are gold deals.
     */
    public function up(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->string('deal_type', 10)->default('gold')->after('email');
            $table->decimal('price_cash', 15, 2)->nullable()->after('cost');
            $table->decimal('cost_cash', 15, 2)->nullable()->after('price_cash');
            $table->string('cash_currency', 3)->nullable()->after('cost_cash');
        });
    }

    public function down(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->dropColumn(['deal_type', 'price_cash', 'cost_cash', 'cash_currency']);
        });
    }
};
