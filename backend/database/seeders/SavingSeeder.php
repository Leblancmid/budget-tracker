<?php

namespace Database\Seeders;

use App\Models\Saving;
use Illuminate\Database\Seeder;

class SavingSeeder extends Seeder
{
    public function run(): void
    {
        $savings = [
            // June deposits
            ['mode_of_payment' => 'CIMB',     'type' => 'deposit',  'transfer' => 'daily_expenses', 'description' => 'Salary allotment — June',   'amount' => 5000,  'date' => '2026-06-01'],
            ['mode_of_payment' => 'MARIBANK',  'type' => 'deposit',  'transfer' => 'business',       'description' => 'Business profit — June',    'amount' => 2136,  'date' => '2026-06-07'],
            ['mode_of_payment' => 'GCASH',     'type' => 'deposit',  'transfer' => 'daily_expenses', 'description' => 'Extra income deposit',       'amount' => 1500,  'date' => '2026-06-15'],
            ['mode_of_payment' => 'CIMB',      'type' => 'deposit',  'transfer' => 'business',       'description' => 'Gold trade profit — June',  'amount' => 736,   'date' => '2026-06-22'],
            ['mode_of_payment' => 'MARIBANK',  'type' => 'deposit',  'transfer' => 'daily_expenses', 'description' => 'Salary allotment — June 2', 'amount' => 3000,  'date' => '2026-06-25'],

            // June withdrawals
            ['mode_of_payment' => 'GCASH',     'type' => 'withdraw', 'transfer' => 'daily_expenses', 'description' => 'Emergency expense',          'amount' => 800,   'date' => '2026-06-18'],

            // July deposits
            ['mode_of_payment' => 'CIMB',     'type' => 'deposit',  'transfer' => 'daily_expenses', 'description' => 'Salary allotment — July',   'amount' => 5000,  'date' => '2026-07-01'],
            ['mode_of_payment' => 'MARIBANK',  'type' => 'deposit',  'transfer' => 'business',       'description' => 'Account sale profit',       'amount' => 600,   'date' => '2026-07-03'],
            ['mode_of_payment' => 'GCASH',     'type' => 'deposit',  'transfer' => 'daily_expenses', 'description' => 'Freelance payment',          'amount' => 2500,  'date' => '2026-07-05'],
        ];

        foreach ($savings as $data) {
            Saving::create($data);
        }
    }
}