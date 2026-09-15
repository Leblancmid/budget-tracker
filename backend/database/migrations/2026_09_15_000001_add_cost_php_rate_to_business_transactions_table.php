<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('business_transactions', 'cost_php_rate')) {
                $table->decimal('cost_php_rate', 10, 4)->nullable()->after('php_rate');
            }
        });
    }

    public function down(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('business_transactions', 'cost_php_rate')) {
                $table->dropColumn('cost_php_rate');
            }
        });
    }
};
