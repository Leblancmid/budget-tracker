<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * system_key marks app-managed rows that must never be deleted,
     * e.g. the pinned "Middleman Fee" gold trade.
     */
    public function up(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            if (! Schema::hasColumn('business_transactions', 'system_key')) {
                $table->string('system_key', 50)->nullable()->unique()->after('type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('business_transactions', 'system_key')) {
                $table->dropUnique(['system_key']);
                $table->dropColumn('system_key');
            }
        });
    }
};
