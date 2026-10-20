<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * How much of a gold trade's price has been put into the Golds inventory.
     * NULL = trade predates this tracking (its gold was never added), so it's left alone.
     */
    public function up(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('business_transactions', 'inventory_gold')) {
                $table->decimal('inventory_gold', 20, 0)->nullable()->after('cost_gold_paid');
            }
        });
    }

    public function down(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('business_transactions', 'inventory_gold')) {
                $table->dropColumn('inventory_gold');
            }
        });
    }
};
