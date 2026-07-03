<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            $table->foreignId('account_id')->nullable()->constrained('rucoy_accounts')->nullOnDelete()->after('type');
            $table->decimal('price_rate', 10, 6)->nullable()->after('account_id');
            $table->decimal('cost_rate', 10, 6)->nullable()->after('price_rate');
            $table->decimal('php_rate', 10, 4)->nullable()->after('cost_rate');
        });
    }

    public function down(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            $table->dropForeign(['account_id']);
            $table->dropColumn(['account_id', 'price_rate', 'cost_rate', 'php_rate']);
        });
    }
};
