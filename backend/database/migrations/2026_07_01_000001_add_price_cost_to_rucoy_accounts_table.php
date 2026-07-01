<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->decimal('price', 12, 2)->nullable()->after('avatar');
            $table->decimal('cost', 12, 2)->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->dropColumn(['price', 'cost']);
        });
    }
};
