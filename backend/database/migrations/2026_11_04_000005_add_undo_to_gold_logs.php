<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * What a history entry's Undo should reverse beyond the stash, e.g. a gold trade sale:
     * {"kind": "trade_sale", "sold_id": 12, "remaining_id": 9, "gold": 540000000}.
     * Null for entries that only moved gold (corrections, manual adds) and older entries.
     */
    public function up(): void
    {
        Schema::table('gold_logs', function (Blueprint $table) {
            $table->json('undo')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('gold_logs', function (Blueprint $table) {
            $table->dropColumn('undo');
        });
    }
};
