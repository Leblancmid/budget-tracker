<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            // Income
            ['name' => 'Salary',          'type' => 'income',  'color' => '#4f46e5', 'icon' => 'Briefcase'],
            ['name' => 'Freelance',        'type' => 'income',  'color' => '#0891b2', 'icon' => 'Laptop'],
            ['name' => 'Business Income',  'type' => 'income',  'color' => '#059669', 'icon' => 'TrendingUp'],
            ['name' => 'Other Income',     'type' => 'income',  'color' => '#7c3aed', 'icon' => 'CirclePlus'],

            // Expense
            ['name' => 'Food & Dining',    'type' => 'expense', 'color' => '#f59e0b', 'icon' => 'UtensilsCrossed'],
            ['name' => 'Transportation',   'type' => 'expense', 'color' => '#3b82f6', 'icon' => 'Car'],
            ['name' => 'Utilities',        'type' => 'expense', 'color' => '#8b5cf6', 'icon' => 'Zap'],
            ['name' => 'Entertainment',    'type' => 'expense', 'color' => '#ec4899', 'icon' => 'Film'],
            ['name' => 'Shopping',         'type' => 'expense', 'color' => '#ef4444', 'icon' => 'ShoppingBag'],
            ['name' => 'Health',           'type' => 'expense', 'color' => '#10b981', 'icon' => 'Heart'],
            ['name' => 'Housing',          'type' => 'expense', 'color' => '#6366f1', 'icon' => 'Home'],
            ['name' => 'Miscellaneous',    'type' => 'expense', 'color' => '#94a3b8', 'icon' => 'MoreHorizontal'],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
