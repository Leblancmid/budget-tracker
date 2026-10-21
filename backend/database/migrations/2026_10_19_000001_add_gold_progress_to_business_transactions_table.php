<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('business_transactions', 'price_gold_received')) {
                $table->decimal('price_gold_received', 20, 0)->nullable()->after('cost_gold');
            }
            if (! Schema::hasColumn('business_transactions', 'cost_gold_paid')) {
                $table->decimal('cost_gold_paid', 20, 0)->nullable()->after('price_gold_received');
            }
        });
    }

    public function down(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            foreach (['price_gold_received', 'cost_gold_paid'] as $column) {
                if (Schema::hasColumn('business_transactions', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
