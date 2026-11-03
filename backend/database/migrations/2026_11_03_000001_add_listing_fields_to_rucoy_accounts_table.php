<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * What a buyer sees in a listing: the in-game stats screen (level, skills),
     * its screenshot, whether the price is shown, and when it went up for sale.
     * listed_at → archived_at (sold) gives days-to-sell for pricing decisions.
     */
    public function up(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->unsignedSmallInteger('level')->nullable()->after('email');
            $table->unsignedSmallInteger('melee')->nullable()->after('level');
            $table->unsignedSmallInteger('distance')->nullable()->after('melee');
            $table->unsignedSmallInteger('magic')->nullable()->after('distance');
            $table->unsignedSmallInteger('defense')->nullable()->after('magic');
            $table->string('screenshot')->nullable()->after('avatar');
            $table->boolean('show_price')->default(false)->after('cost');
            $table->timestamp('listed_at')->nullable()->after('payment_date')->index();
        });

        // Existing accounts were listed when they were added
        DB::table('rucoy_accounts')->whereNull('listed_at')->update(['listed_at' => DB::raw('created_at')]);
    }

    public function down(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->dropIndex(['listed_at']);
            $table->dropColumn(['level', 'melee', 'distance', 'magic', 'defense', 'screenshot', 'show_price', 'listed_at']);
        });
    }
};
