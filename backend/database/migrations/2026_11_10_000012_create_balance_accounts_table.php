<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Balance wallets (user-managed). code is stored on balance_entries.account. Optional interest:
 * a yearly rate minus withholding tax, credited daily. checked_*: the last bank check.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('balance_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->string('currency', 3)->default('USD'); // USD | PHP
            $table->string('color', 20)->default('slate');
            $table->string('icon', 30)->default('wallet');
            $table->decimal('interest_rate', 7, 4)->nullable();      // % per year
            $table->decimal('interest_tax', 5, 2)->default(20);      // % withheld
            $table->date('interest_credited_through')->nullable();
            $table->date('checked_at')->nullable();
            $table->decimal('checked_balance', 14, 2)->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamp('hidden_at')->nullable();
            $table->timestamps();
        });

        // The starting wallets
        $now = now();
        DB::table('balance_accounts')->insert([
            ['code' => 'PAYPAL',   'name' => 'PayPal',   'currency' => 'USD', 'color' => 'blue',   'icon' => 'wallet',     'sort_order' => 1, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'BINANCE',  'name' => 'Binance',  'currency' => 'USD', 'color' => 'yellow', 'icon' => 'coins',      'sort_order' => 2, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'MEXC',     'name' => 'MEXC',     'currency' => 'USD', 'color' => 'cyan',   'icon' => 'coins',      'sort_order' => 3, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'MARIBANK', 'name' => 'Maribank', 'currency' => 'PHP', 'color' => 'green',  'icon' => 'landmark',   'sort_order' => 4, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'MAYA',     'name' => 'Maya',     'currency' => 'PHP', 'color' => 'violet', 'icon' => 'smartphone', 'sort_order' => 5, 'created_at' => $now, 'updated_at' => $now],
            ['code' => 'BANKO',    'name' => 'BanKo',    'currency' => 'PHP', 'color' => 'orange', 'icon' => 'landmark',   'sort_order' => 6, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('balance_accounts');
    }
};
