<?php

namespace Database\Seeders;

use App\Models\RucoyAccount;
use Illuminate\Database\Seeder;

class RucoyAccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'description'    => 'Level 120 Warrior — full equip',
                'email'          => 'buyer1@gmail.com',
                'avatar'         => null,
                'price'          => 4500,
                'cost'           => 3200,
                'payment_status' => 'paid',
            ],
            [
                'description'    => 'Level 95 Mage — starter gear',
                'email'          => 'buyer2@gmail.com',
                'avatar'         => null,
                'price'          => 1800,
                'cost'           => 1200,
                'payment_status' => 'paid',
            ],
            [
                'description'    => 'Level 150 Archer — rare items',
                'email'          => 'buyer3@yahoo.com',
                'avatar'         => null,
                'price'          => 7200,
                'cost'           => 5500,
                'payment_status' => 'pending',
            ],
            [
                'description'    => 'Level 80 Warrior — basic',
                'email'          => 'buyer4@gmail.com',
                'avatar'         => null,
                'price'          => 900,
                'cost'           => 600,
                'payment_status' => 'paid',
            ],
        ];

        foreach ($accounts as $data) {
            $account = RucoyAccount::create($data);

            // Archive the first two as sold
            if (in_array($data['description'], [
                'Level 120 Warrior — full equip',
                'Level 95 Mage — starter gear',
            ])) {
                $account->update(['archived_at' => now()->subDays(rand(10, 30))]);
            }
        }
    }
}