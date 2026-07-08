<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('business_transactions', 'price_php')) {
                $table->decimal('price_php', 15, 2)->nullable()->after('php_rate');
            }
            if (!Schema::hasColumn('business_transactions', 'cost_php')) {
                $table->decimal('cost_php', 15, 2)->nullable()->after('price_php');
            }
            if (!Schema::hasColumn('business_transactions', 'profit_php')) {
                $table->decimal('profit_php', 15, 2)->nullable()->after('cost_php');
            }
        });
    }

    public function down(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            $table->dropColumn(['price_php', 'cost_php', 'profit_php']);
        });
    }
};
