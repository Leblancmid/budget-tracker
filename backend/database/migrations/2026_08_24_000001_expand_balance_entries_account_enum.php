<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE balance_entries MODIFY COLUMN account ENUM('PAYPAL','BINANCE','MEXC','MARIBANK','MAYA','BANKO') NOT NULL");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE balance_entries MODIFY COLUMN account ENUM('PAYPAL','BINANCE') NOT NULL");
    }
};
