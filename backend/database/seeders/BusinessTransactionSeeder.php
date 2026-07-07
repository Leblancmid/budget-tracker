<?php

namespace Database\Seeders;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use Illuminate\Database\Seeder;

class BusinessTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $account1 = RucoyAccount::where('payment_status', 'paid')->first();
        $account2 = RucoyAccount::where('payment_status', 'paid')->skip(1)->first();

        $transactions = [
            // Account buy
            [
                'type'        => 'account',
                'action'      => 'buy',
                'account_id'  => $account1?->id,
                'price_rate'  => null,
                'cost_rate'   => null,
                'php_rate'    => null,
                'price_php'   => 3200,
                'cost_php'    => 3200,
                'profit_php'  => 0,
                'amount'      => 1,
                'description' => 'Bought Lv120 Warrior account',
                'date'        => '2026-05-15',
                'notes'       => 'Paid via GCash',
                'archived_at' => null,
            ],
            // Account sell
            [
                'type'        => 'account',
                'action'      => 'sell',
                'account_id'  => $account1?->id,
                'price_rate'  => null,
                'cost_rate'   => null,
                'php_rate'    => null,
                'price_php'   => 4500,
                'cost_php'    => 3200,
                'profit_php'  => 1300,
                'amount'      => 1,
                'description' => 'Sold Lv120 Warrior account',
                'date'        => '2026-05-28',
                'notes'       => 'Buyer paid via GCash',
                'archived_at' => null,
            ],
            // Account buy
            [
                'type'        => 'account',
                'action'      => 'buy',
                'account_id'  => $account2?->id,
                'price_rate'  => null,
                'cost_rate'   => null,
                'php_rate'    => null,
                'price_php'   => 1200,
                'cost_php'    => 1200,
                'profit_php'  => 0,
                'amount'      => 1,
                'description' => 'Bought Lv95 Mage account',
                'date'        => '2026-06-03',
                'notes'       => null,
                'archived_at' => null,
            ],
            // Account sell
            [
                'type'        => 'account',
                'action'      => 'sell',
                'account_id'  => $account2?->id,
                'price_rate'  => null,
                'cost_rate'   => null,
                'php_rate'    => null,
                'price_php'   => 1800,
                'cost_php'    => 1200,
                'profit_php'  => 600,
                'amount'      => 1,
                'description' => 'Sold Lv95 Mage account',
                'date'        => '2026-06-14',
                'notes'       => null,
                'archived_at' => null,
            ],
            // Gold trade
            [
                'type'        => 'gold',
                'action'      => 'sell',
                'account_id'  => null,
                'price_rate'  => 0.000022,
                'cost_rate'   => 0.000018,
                'php_rate'    => 57.50,
                'price_php'   => 1265,
                'cost_php'    => 1035,
                'profit_php'  => 230,
                'amount'      => 50000,
                'description' => 'Gold sale — player A',
                'date'        => '2026-06-06',
                'notes'       => null,
                'archived_at' => null,
            ],
            // Gold trade USD
            [
                'type'        => 'gold',
                'action'      => 'sell',
                'account_id'  => null,
                'price_rate'  => 0.000024,
                'cost_rate'   => 0.000018,
                'php_rate'    => 57.80,
                'price_php'   => 2025.60,
                'cost_php'    => 1519.20,
                'profit_php'  => 506.40,
                'amount'      => 80000,
                'description' => 'Gold sale — player C (USD)',
                'date'        => '2026-06-19',
                'notes'       => 'PayPal payment',
                'archived_at' => null,
            ],
            // Expense
            [
                'type'        => 'expense',
                'action'      => null,
                'account_id'  => null,
                'price_rate'  => null,
                'cost_rate'   => null,
                'php_rate'    => null,
                'price_php'   => null,
                'cost_php'    => 350,
                'profit_php'  => -350,
                'amount'      => 1,
                'description' => 'Load / mobile data',
                'date'        => '2026-06-01',
                'notes'       => null,
                'archived_at' => null,
            ],
            [
                'type'        => 'expense',
                'action'      => null,
                'account_id'  => null,
                'price_rate'  => null,
                'cost_rate'   => null,
                'php_rate'    => null,
                'price_php'   => null,
                'cost_php'    => 199,
                'profit_php'  => -199,
                'amount'      => 1,
                'description' => 'VPN subscription',
                'date'        => '2026-07-01',
                'notes'       => null,
                'archived_at' => null,
            ],
        ];

        foreach ($transactions as $data) {
            BusinessTransaction::create($data);
        }
    }
}