<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::factory()->create([
            'name'     => 'Mikey',
            'email'    => 'mikey@example.com',
            'password' => Hash::make('password'),
        ]);

        $this->call([
            CategorySeeder::class,
            TransactionSeeder::class,
            BudgetSeeder::class,
            GoldSeeder::class,
            RucoyAccountSeeder::class,
            TradeSeeder::class,
            BusinessTransactionSeeder::class,
            SavingSeeder::class,
        ]);
    }
}
