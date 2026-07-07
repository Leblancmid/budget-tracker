<?php

namespace Database\Seeders;

use App\Models\Gold;
use App\Models\GoldLog;
use Illuminate\Database\Seeder;

class GoldSeeder extends Seeder
{
    public function run(): void
    {
        Gold::create([
            'amount'      => 620000,
            'description' => 'Current gold stash',
        ]);

        $logs = [
            ['type' => 'add',  'amount' => 200000, 'description' => 'Gold farming — week 1'],
            ['type' => 'add',  'amount' => 150000, 'description' => 'Gold farming — week 2'],
            ['type' => 'sell', 'amount' => 50000,  'description' => 'Sold to player A (KKS)'],
            ['type' => 'add',  'amount' => 180000, 'description' => 'Gold farming — week 3'],
            ['type' => 'sell', 'amount' => 80000,  'description' => 'Sold to player B (CASH)'],
            ['type' => 'add',  'amount' => 220000, 'description' => 'Gold farming — week 4'],
        ];

        foreach ($logs as $log) {
            GoldLog::create($log);
        }
    }
}