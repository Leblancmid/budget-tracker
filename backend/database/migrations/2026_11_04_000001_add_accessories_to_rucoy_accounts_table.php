<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Accessories an account comes with (buff rings/necklaces, decorations), shown on the listing image. */
    public function up(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->json('accessories')->nullable()->after('defense');
        });
    }

    public function down(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->dropColumn('accessories');
        });
    }
};
