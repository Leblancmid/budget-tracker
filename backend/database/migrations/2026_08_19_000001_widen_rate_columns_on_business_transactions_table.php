<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            $table->decimal('price_rate', 20, 6)->nullable()->change();
            $table->decimal('cost_rate', 20, 6)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            $table->decimal('price_rate', 10, 6)->nullable()->change();
            $table->decimal('cost_rate', 10, 6)->nullable()->change();
        });
    }
};
