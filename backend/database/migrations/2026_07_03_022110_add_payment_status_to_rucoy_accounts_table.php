<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->enum('payment_status', ['not_paid', 'partially_paid', 'fully_paid'])
                  ->default('not_paid')
                  ->after('cost');
        });
    }

    public function down(): void
    {
        Schema::table('rucoy_accounts', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });
    }
};
