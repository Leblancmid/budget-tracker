<?php

namespace Database\Seeders;

use App\Models\Gold;
use App\Models\Trade;
use Illuminate\Database\Seeder;

class TradeSeeder extends Seeder
{
    public function run(): void
    {
        $gold = Gold::first();

        $trades = [
            [
                'gold_id'         => $gold?->id,
                'description'     => 'Trade with player A',
                'status'          => 'kks',
                'amount'          => 50000,
                'currency'        => 'PHP',
                'payment_method'  => 'GCash',
                'start_date'      => '2026-06-05',
                'completion_date' => '2026-06-06',
            ],
            [
                'gold_id'         => $gold?->id,
                'description'     => 'Trade with player B',
                'status'          => 'cash',
                'amount'          => 1200,
                'currency'        => 'PHP',
                'payment_method'  => 'Bank Transfer',
                'start_date'      => '2026-06-10',
                'completion_date' => '2026-06-11',
            ],
            [
                'gold_id'         => $gold?->id,
                'description'     => 'Trade with player C (USD)',
                'status'          => 'kks',
                'amount'          => 80000,
                'currency'        => 'USD',
                'payment_method'  => 'PayPal',
                'start_date'      => '2026-06-18',
                'completion_date' => '2026-06-19',
            ],
            [
                'gold_id'         => $gold?->id,
                'description'     => 'Trade with player D',
                'status'          => 'cash',
                'amount'          => 2500,
                'currency'        => 'PHP',
                'payment_method'  => 'GCash',
                'start_date'      => '2026-07-01',
                'completion_date' => '2026-07-02',
            ],
            [
                'gold_id'         => $gold?->id,
                'description'     => 'Trade with player E',
                'status'          => 'kks',
                'amount'          => 120000,
                'currency'        => 'PHP',
                'payment_method'  => 'GCash',
                'start_date'      => '2026-07-04',
                'completion_date' => null,
            ],
        ];

        foreach ($trades as $i => $data) {
            $trade = Trade::create($data);

            // Archive the first 3
            if ($i < 3) {
                $trade->update(['archived_at' => now()->subDays(rand(5, 20))]);
            }
        }
    }
}