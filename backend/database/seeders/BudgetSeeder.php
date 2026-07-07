<?php

namespace Database\Seeders;

use App\Models\Budget;
use App\Models\Category;
use Illuminate\Database\Seeder;

class BudgetSeeder extends Seeder
{
    public function run(): void
    {
        $cat = fn(string $name) => Category::where('name', $name)->value('id');

        $budgets = [
            // June 2026
            ['category_id' => $cat('Food & Dining'),  'amount' => 5000,  'month' => 6, 'year' => 2026],
            ['category_id' => $cat('Transportation'),  'amount' => 1500,  'month' => 6, 'year' => 2026],
            ['category_id' => $cat('Utilities'),       'amount' => 2500,  'month' => 6, 'year' => 2026],
            ['category_id' => $cat('Entertainment'),   'amount' => 1000,  'month' => 6, 'year' => 2026],
            ['category_id' => $cat('Shopping'),        'amount' => 2000,  'month' => 6, 'year' => 2026],
            ['category_id' => $cat('Health'),          'amount' => 1000,  'month' => 6, 'year' => 2026],
            ['category_id' => $cat('Housing'),         'amount' => 8000,  'month' => 6, 'year' => 2026],
            ['category_id' => $cat('Miscellaneous'),   'amount' => 500,   'month' => 6, 'year' => 2026],

            // July 2026
            ['category_id' => $cat('Food & Dining'),  'amount' => 5000,  'month' => 7, 'year' => 2026],
            ['category_id' => $cat('Transportation'),  'amount' => 1500,  'month' => 7, 'year' => 2026],
            ['category_id' => $cat('Utilities'),       'amount' => 2500,  'month' => 7, 'year' => 2026],
            ['category_id' => $cat('Entertainment'),   'amount' => 1000,  'month' => 7, 'year' => 2026],
            ['category_id' => $cat('Shopping'),        'amount' => 2000,  'month' => 7, 'year' => 2026],
            ['category_id' => $cat('Health'),          'amount' => 1000,  'month' => 7, 'year' => 2026],
            ['category_id' => $cat('Housing'),         'amount' => 8000,  'month' => 7, 'year' => 2026],
            ['category_id' => $cat('Miscellaneous'),   'amount' => 500,   'month' => 7, 'year' => 2026],
        ];

        foreach ($budgets as $data) {
            Budget::create($data);
        }
    }
}