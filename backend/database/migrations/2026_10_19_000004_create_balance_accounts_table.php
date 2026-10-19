<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Balance accounts become user-managed instead of a hard-coded ENUM.
     * Existing entries keep their account code, so nothing needs re-mapping.
     */
    public function up(): void
    {
        Schema::create('balance_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();      // stored on balance_entries.account
            $table->string('name', 100);
            $table->string('currency', 3)->default('USD'); // USD | PHP
            $table->string('color', 20)->default('slate');
            $table->string('icon', 30)->default('wallet');
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('hidden_at')->nullable();
            $table->timestamps();
        });

        $now = now();
        DB::table('balance_accounts')->insert([
            ['code' => 'PAYPAL',   'name' => 'PayPal',   'currency' => 'USD', 'color' => 'blue',   'icon' => 'wallet',   'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'BINANCE',  'name' => 'Binance',  'currency' => 'USD', 'color' => 'yellow', 'icon' => 'coins',    'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'MEXC',     'name' => 'MEXC',     'currency' => 'USD', 'color' => 'cyan',   'icon' => 'coins',    'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'MARIBANK', 'name' => 'Maribank', 'currency' => 'PHP', 'color' => 'green',  'icon' => 'landmark', 'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'MAYA',     'name' => 'Maya',     'currency' => 'PHP', 'color' => 'violet', 'icon' => 'smartphone', 'sort_order' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'BANKO',    'name' => 'BanKo',    'currency' => 'PHP', 'color' => 'orange', 'icon' => 'landmark', 'sort_order' => 6, 'created_at' => $now, 'updated_at' => $now],
        ]);

        DB::statement('ALTER TABLE balance_entries MODIFY COLUMN account VARCHAR(50) NOT NULL');
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE balance_entries MODIFY COLUMN account ENUM('PAYPAL','BINANCE','MEXC','MARIBANK','MAYA','BANKO') NOT NULL");
        Schema::dropIfExists('balance_accounts');
    }
};
