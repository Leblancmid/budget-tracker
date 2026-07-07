<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Database\Seeder;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $cat = fn(string $name) => Category::where('name', $name)->value('id');

        $transactions = [
            // June 2026
            ['category_id' => $cat('Salary'),       'type' => 'income',  'amount' => 28000, 'description' => 'June salary',            'date' => '2026-06-01', 'notes' => null],
            ['category_id' => $cat('Food & Dining'), 'type' => 'expense', 'amount' => 350,   'description' => 'Grocery run',            'date' => '2026-06-02', 'notes' => null],
            ['category_id' => $cat('Transportation'),'type' => 'expense', 'amount' => 120,   'description' => 'Grab — office commute',  'date' => '2026-06-03', 'notes' => null],
            ['category_id' => $cat('Food & Dining'), 'type' => 'expense', 'amount' => 280,   'description' => 'Lunch with team',        'date' => '2026-06-05', 'notes' => null],
            ['category_id' => $cat('Utilities'),     'type' => 'expense', 'amount' => 1200,  'description' => 'Electricity bill',       'date' => '2026-06-08', 'notes' => null],
            ['category_id' => $cat('Utilities'),     'type' => 'expense', 'amount' => 650,   'description' => 'Internet bill',          'date' => '2026-06-08', 'notes' => null],
            ['category_id' => $cat('Food & Dining'), 'type' => 'expense', 'amount' => 420,   'description' => 'Groceries week 2',       'date' => '2026-06-10', 'notes' => null],
            ['category_id' => $cat('Health'),        'type' => 'expense', 'amount' => 500,   'description' => 'Vitamins & supplements',  'date' => '2026-06-12', 'notes' => null],
            ['category_id' => $cat('Entertainment'), 'type' => 'expense', 'amount' => 399,   'description' => 'Netflix + Spotify',      'date' => '2026-06-13', 'notes' => null],
            ['category_id' => $cat('Freelance'),     'type' => 'income',  'amount' => 5000,  'description' => 'Web design project',     'date' => '2026-06-15', 'notes' => null],
            ['category_id' => $cat('Food & Dining'), 'type' => 'expense', 'amount' => 680,   'description' => 'Family dinner out',      'date' => '2026-06-16', 'notes' => null],
            ['category_id' => $cat('Transportation'),'type' => 'expense', 'amount' => 200,   'description' => 'Grab week 2',            'date' => '2026-06-17', 'notes' => null],
            ['category_id' => $cat('Shopping'),      'type' => 'expense', 'amount' => 1800,  'description' => 'Clothing — sale haul',   'date' => '2026-06-20', 'notes' => null],
            ['category_id' => $cat('Housing'),       'type' => 'expense', 'amount' => 8000,  'description' => 'Monthly rent',           'date' => '2026-06-25', 'notes' => null],
            ['category_id' => $cat('Food & Dining'), 'type' => 'expense', 'amount' => 390,   'description' => 'Grocery run week 4',     'date' => '2026-06-26', 'notes' => null],
            ['category_id' => $cat('Miscellaneous'), 'type' => 'expense', 'amount' => 250,   'description' => 'Misc purchases',         'date' => '2026-06-28', 'notes' => null],

            // July 2026
            ['category_id' => $cat('Salary'),        'type' => 'income',  'amount' => 28000, 'description' => 'July salary',            'date' => '2026-07-01', 'notes' => null],
            ['category_id' => $cat('Housing'),       'type' => 'expense', 'amount' => 8000,  'description' => 'Monthly rent',           'date' => '2026-07-01', 'notes' => null],
            ['category_id' => $cat('Utilities'),     'type' => 'expense', 'amount' => 1250,  'description' => 'Electricity bill',       'date' => '2026-07-03', 'notes' => null],
            ['category_id' => $cat('Food & Dining'), 'type' => 'expense', 'amount' => 410,   'description' => 'Weekly grocery',         'date' => '2026-07-04', 'notes' => null],
            ['category_id' => $cat('Transportation'),'type' => 'expense', 'amount' => 150,   'description' => 'Grab rides',             'date' => '2026-07-05', 'notes' => null],
            ['category_id' => $cat('Food & Dining'), 'type' => 'expense', 'amount' => 320,   'description' => 'Lunch & merienda',       'date' => '2026-07-07', 'notes' => null],
        ];

        foreach ($transactions as $data) {
            Transaction::create($data);
        }
    }
}