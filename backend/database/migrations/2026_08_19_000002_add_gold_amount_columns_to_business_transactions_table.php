<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            $table->decimal('price_gold', 20, 0)->nullable()->after('cost_rate');
            $table->decimal('cost_gold', 20, 0)->nullable()->after('price_gold');
        });
    }

    public function down(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            $table->dropColumn(['price_gold', 'cost_gold']);
        });
    }
};
