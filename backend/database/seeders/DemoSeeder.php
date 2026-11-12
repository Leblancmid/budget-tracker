<?php

namespace Database\Seeders;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use App\Models\Trade;
use App\Models\User;
use App\Services\BusinessTransactionService;
use App\Services\GoldInventory;
use App\Services\WebsiteContent;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

/**
 * Invented data for screenshots and demos: five months of gold trades and account sales, listed
 * accounts, the gold stash, trades and wallets. Nothing in it is real.
 *
 * Only for a scratch database (it adds to whatever is there):
 *   php artisan migrate:fresh --seed --seeder=DemoSeeder   (with DB_DATABASE set to a scratch copy)
 *
 * Records are created through the same service the Sales page uses, with the clock set to each
 * invented date, so totals, profit, the stash and its history all agree.
 */
class DemoSeeder extends Seeder
{
    private const ZONE = 'Asia/Manila';

    /** $ per 1KK gold */
    private const SELL_RATES = [0.19, 0.195, 0.2, 0.205, 0.21];

    private const BUY_RATES = [0.155, 0.16, 0.165, 0.17];

    /** ₱ per $ */
    private const PHP_RATE = 58.5;

    private const BUILDS = ['Dist', 'Melee', 'Magic'];

    /** Levels already used, so no two accounts look the same */
    private array $levels = [];

    private const BUYERS = ['Kairo', 'Yuno', 'Mika', 'Draven', 'Selene', 'Rho', 'Tamsin', 'Vex', 'Juno', 'Orin', 'Lyra', 'Bastian'];

    public function run(): void
    {
        mt_srand(20261112);
        $service = app(BusinessTransactionService::class);
        $today = CarbonImmutable::now(self::ZONE)->startOfDay();

        User::firstOrCreate(['email' => 'demo@example.com'], ['name' => 'Demo', 'password' => Hash::make('demo-password-' . bin2hex(random_bytes(6)))]);

        // Opening stash and wallets, before the first month
        $this->at($today->subMonths(5)->startOfMonth(), function () {
            GoldInventory::record(14_000_000_000, 'Opening stash');
            $this->wallets();
        });

        // Gold trades: bought and sold through each month
        for ($m = 4; $m >= 0; $m--) {
            $month = $today->subMonths($m)->startOfMonth();
            $days = $m === 0 ? $today->day : $month->daysInMonth;
            $count = $m === 0 ? 6 : mt_rand(8, 12);
            for ($i = 0; $i < $count; $i++) {
                $day = $month->addDays(mt_rand(0, $days - 1))->setTime(mt_rand(9, 22), mt_rand(0, 59));
                $this->goldTrade($service, $day, sold: true);
            }
        }
        // A few still being sold
        foreach ([3, 2, 1] as $daysAgo) {
            $this->goldTrade($service, $today->subDays($daysAgo)->setTime(15, 0), sold: false);
        }

        // Accounts: most sold over the months, some still listed
        for ($i = 0; $i < 14; $i++) {
            $listed = $today->subDays(mt_rand(20, 150))->setTime(mt_rand(10, 21), 0);
            $sold = $listed->addDays(mt_rand(3, 25));
            $this->account($service, $listed, $sold->lessThan($today) ? $sold : null);
        }
        for ($i = 0; $i < 6; $i++) {
            $this->account($service, $today->subDays(mt_rand(1, 18))->setTime(mt_rand(10, 21), 0), null);
        }

        // Small running costs
        foreach (['Discord Nitro', 'Mobile data', 'Cloudflare domain'] as $i => $what) {
            $this->at($today->subMonths($i + 1)->startOfMonth()->addDays(2), function () use ($service, $what) {
                $tx = $service->create(['type' => 'expense', 'amount' => [280, 349, 650][mt_rand(0, 2)], 'cost_php' => null,
                    'description' => $what, 'date' => now(self::ZONE)->toDateString()], false);
                $tx->update(['archived_at' => now()]);
            });
        }

        $this->trades($today);

        // The middleman-fee trade the app keeps by itself: priced like the rest, so nothing shows "awaiting pricing"
        foreach (BusinessTransaction::whereNotNull('system_key')->get() as $fees) {
            $gold = (float) $fees->price_gold;
            $service->update($fees, ['price_rate' => 0.2, 'cost_rate' => 0, 'php_rate' => self::PHP_RATE, 'cost_php_rate' => self::PHP_RATE,
                'price_php' => round($gold / 1e6 * 0.2 * self::PHP_RATE, 2), 'cost_php' => 0]);
        }

        WebsiteContent::saveGold([
            'rates' => [
                ['method' => 'Binance', 'currency' => 'USD', 'per_kk' => 0.21],
                ['method' => 'PayPal', 'currency' => 'USD', 'per_kk' => 0.23],
                ['method' => 'GCash', 'currency' => 'PHP', 'per_kk' => 12.5],
            ],
            'min_order_kk' => 100,
            'note' => null,
        ]);

        Carbon::setTestNow();
    }

    /** Run with the clock at this (Manila) moment, so every record and timestamp lands on it. */
    private function at(CarbonImmutable $when, callable $do): void
    {
        Carbon::setTestNow(Carbon::instance($when->utc()));
        $do();
    }

    private function goldTrade(BusinessTransactionService $service, CarbonImmutable $when, bool $sold): void
    {
        $this->at($when, function () use ($service, $sold) {
            $gold = mt_rand(4, 30) * 50_000_000;
            $sell = self::SELL_RATES[mt_rand(0, count(self::SELL_RATES) - 1)];
            $buy = self::BUY_RATES[mt_rand(0, count(self::BUY_RATES) - 1)];
            // ₱ worked out the way the Add Gold form does: gold ÷ 1M × $ rate × ₱ rate
            $pricePhp = round($gold / 1e6 * $sell * self::PHP_RATE, 2);
            $costPhp = round($gold / 1e6 * $buy * self::PHP_RATE, 2);
            $profit = $pricePhp - $costPhp;
            $tx = $service->create([
                'type' => 'gold', 'amount' => max($profit, 0.01), 'date' => now(self::ZONE)->toDateString(),
                'description' => $this->kk($gold) . ' · ' . self::BUYERS[mt_rand(0, count(self::BUYERS) - 1)],
                'price_gold' => $gold, 'cost_gold' => $gold, 'price_gold_received' => $gold, 'cost_gold_paid' => $gold,
                'price_rate' => $sell, 'cost_rate' => $buy, 'php_rate' => self::PHP_RATE, 'cost_php_rate' => self::PHP_RATE,
                'price_php' => $pricePhp, 'cost_php' => $costPhp,
            ], true);
            if ($sold) {
                $service->sell($tx, $gold, '', true);
            }
        });
    }

    private function account(BusinessTransactionService $service, CarbonImmutable $listed, ?CarbonImmutable $sold): void
    {
        $build = self::BUILDS[mt_rand(0, 2)];
        do {
            $level = mt_rand(560, 720);
        } while (in_array($level, $this->levels, true));
        $this->levels[] = $level;
        $main = mt_rand(118, 152);
        $stats = ['melee' => mt_rand(8, 40), 'distance' => mt_rand(8, 40), 'magic' => mt_rand(8, 40), 'defense' => mt_rand(110, 150)];
        $stats[['Dist' => 'distance', 'Melee' => 'melee', 'Magic' => 'magic'][$build]] = $main;
        // Higher level, higher price: 0.9KKK–3.6KKK, bought for 70–85% of it
        $price = (int) round((900 + ($level - 560) * 17 + mt_rand(0, 300)) / 50) * 50_000_000;
        $cost = (int) round($price * mt_rand(70, 85) / 100 / 50_000_000) * 50_000_000;

        $this->at($listed, function () use ($service, $build, $level, $stats, $price, $cost, &$account) {
            $account = RucoyAccount::create([
                'description' => "Lv {$level} {$build}", 'email' => strtolower(self::BUYERS[mt_rand(0, count(self::BUYERS) - 1)]) . mt_rand(10, 99) . '@example.com',
                'deal_type' => 'gold', 'level' => $level, ...$stats, 'price' => $price, 'cost' => $cost,
                'payment_status' => 'fully_paid', 'listed_at' => now(), 'show_price' => true,
            ]);
            $sell = self::SELL_RATES[mt_rand(0, count(self::SELL_RATES) - 1)];
            $buy = self::BUY_RATES[mt_rand(0, count(self::BUY_RATES) - 1)];
            $profit = round(($price / 1e6 * $sell - $cost / 1e6 * $buy) * self::PHP_RATE, 2);
            // An invented stat card as its screenshot (for the Listing Kit)
            $path = "screenshots/demo/{$account->id}.svg";
            Storage::disk('public')->put($path, $this->statCard($level, $build, $stats));
            $account->update(['screenshot' => $path]);

            // Paid for in gold from the stash
            GoldInventory::deduct($cost, 'Bought account: ' . $account->description);
            $service->create([
                'type' => 'account', 'account_id' => $account->id, 'amount' => max($profit, 0.01), 'date' => now(self::ZONE)->toDateString(),
                'description' => $account->description, 'price_rate' => $sell, 'cost_rate' => $buy, 'php_rate' => self::PHP_RATE, 'cost_php_rate' => self::PHP_RATE,
            ], false);
        });

        if ($sold) {
            // Same as "Sold" on the account card: the account and its sale are archived, its price joins the stash
            $this->at($sold, function () use ($account, $price) {
                $account->update(['archived_at' => now()]);
                BusinessTransaction::where('account_id', $account->id)->active()->get()->each->update(['archived_at' => now()]);
                GoldInventory::record($price, 'Sold account: ' . $account->description);
            });
        }
    }

    private function trades(CarbonImmutable $today): void
    {
        for ($i = 0; $i < 18; $i++) {
            $done = $i >= 4; // four still open, started this week and due in the next few days
            $start = $done ? $today->subDays(mt_rand(8, 140))->setTime(mt_rand(10, 22), 0) : $today->subDays(mt_rand(0, 3))->setTime(mt_rand(10, 20), 0);
            $this->at($start, function () use ($done, $start, $today, $i) {
                // Mostly gold (KKS) trades; of the four open ones, three KKS and one cash
                $kks = $done ? mt_rand(0, 4) > 0 : $i < 3;
                [$a, $b] = $this->twoNames();
                $trade = Trade::create([
                    'description' => "{$a} ↔ {$b}",
                    'status' => $kks ? 'kks' : 'cash',
                    'amount' => $kks ? mt_rand(4, 40) * 50_000_000 : mt_rand(20, 300),
                    'currency' => $kks ? null : ['USD', 'EUR'][mt_rand(0, 1)],
                    'payment_method' => $kks ? null : ['binance', 'paypal'][mt_rand(0, 1)],
                    'middleman_fee' => $kks ? mt_rand(1, 4) * 5_000_000 : null,
                    'completion_date' => ($done ? $start->addDays(mt_rand(0, 3)) : $today->addDays(mt_rand(1, 4)))->toDateString(),
                ]);
                if ($done) {
                    $trade->update(['archived_at' => now()]);
                }
            });
        }
    }

    /** Two different buyer names */
    private function twoNames(): array
    {
        $a = mt_rand(0, count(self::BUYERS) - 1);
        do {
            $b = mt_rand(0, count(self::BUYERS) - 1);
        } while ($b === $a);

        return [self::BUYERS[$a], self::BUYERS[$b]];
    }

    /** Invented balances in each wallet */
    private function wallets(): void
    {
        foreach (BalanceAccount::all() as $wallet) {
            $amount = $wallet->currency === 'USD' ? mt_rand(40, 900) : mt_rand(2_000, 60_000);
            BalanceEntry::create(['account' => $wallet->code, 'type' => 'add', 'amount' => $amount, 'description' => 'Opening balance', 'date' => now(self::ZONE)->toDateString()]);
        }
    }

    /** An invented character card (not a game screenshot): level, build and the four skills as bars. */
    private function statCard(int $level, string $build, array $stats): string
    {
        $rows = '';
        $y = 150;
        foreach (['melee' => '#e0626b', 'distance' => '#4fb38a', 'magic' => '#7c8cf0', 'defense' => '#d9a441'] as $skill => $color) {
            $v = $stats[$skill];
            $w = (int) round(min($v, 160) / 160 * 470);
            $label = ucfirst($skill);
            $top = $y - 18;
            $rows .= "<text x='60' y='{$y}' fill='#c8ccd6' font-size='22' font-family='Verdana, sans-serif'>{$label}</text>"
                . "<rect x='230' y='{$top}' width='470' height='22' rx='11' fill='#1f2433'/>"
                . "<rect x='230' y='{$top}' width='{$w}' height='22' rx='11' fill='{$color}'/>"
                . "<text x='720' y='{$y}' fill='#ffffff' font-size='22' font-weight='bold' font-family='Verdana, sans-serif'>{$v}</text>";
            $y += 62;
        }

        return "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>"
            . "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#151a27'/><stop offset='1' stop-color='#0b0e16'/></linearGradient></defs>"
            . "<rect width='800' height='450' rx='24' fill='url(#g)'/>"
            . "<text x='60' y='82' fill='#ffffff' font-size='44' font-weight='bold' font-family='Verdana, sans-serif'>Lv {$level}</text>"
            . "<text x='250' y='82' fill='#d9a441' font-size='30' font-family='Verdana, sans-serif'>{$build}</text>"
            . $rows
            . '</svg>';
    }

    /** 500KK, 1.25KKK */
    private function kk(int $gold): string
    {
        return $gold >= 1_000_000_000 ? rtrim(rtrim(number_format($gold / 1e9, 2), '0'), '.') . 'KKK' : ($gold / 1e6) . 'KK';
    }
}
