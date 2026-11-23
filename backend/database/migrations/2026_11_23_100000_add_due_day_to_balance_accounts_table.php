<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** A credit card's payment due day of the month (1–31; a short month uses its last day). */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('balance_accounts', function (Blueprint $table) {
            $table->unsignedTinyInteger('due_day')->nullable()->after('credit_limit');
        });
    }

    public function down(): void
    {
        Schema::table('balance_accounts', function (Blueprint $table) {
            $table->dropColumn('due_day');
        });
    }
};
