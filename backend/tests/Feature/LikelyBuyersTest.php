<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Who to message first about an account for sale: past buyers of a similar one. */
class LikelyBuyersTest extends TestCase
{
    use RefreshDatabase;

    private array $leads = [];

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create(['role' => 'trader']));
        Cache::flush();
        config(['listing.site_url' => 'https://site.test', 'listing.site_token' => str_repeat('t', 40)]);
        Http::fake(fn (Request $r) => str_contains($r->url(), '/api/leads') ? Http::response(['leads' => $this->leads]) : Http::response([], 404));
    }

    /** An account sold to $buyer $daysAgo days ago */
    private function sold(string $name, string $buyer, int $daysAgo, ?float $price = null): void
    {
        $a = RucoyAccount::create(['description' => $name, 'email' => uniqid() . '@x.com']);
        $a->forceFill(['archived_at' => now()->subDays($daysAgo)])->save();
        BusinessTransaction::create(['type' => 'account', 'account_id' => $a->id, 'description' => $name, 'sold_to' => $buyer, 'price_php' => $price, 'amount' => 1, 'date' => now()->subDays($daysAgo)->toDateString()])
            ->forceFill(['archived_at' => now()->subDays($daysAgo)])->save();
    }

    public function test_buyers_of_similar_accounts_come_first(): void
    {
        $this->sold('Lv 640 Melee', 'kai ', 30, 4000);
        $this->sold('Lv 660 Melee', 'Kai', 10, 4500);   // Kai again (spelling ignored, newest shown): 2 similar
        $this->sold('Lv 655 Melee', 'Mia', 5);
        $this->sold('Lv 700 Melee', 'Rho', 3);           // 50 levels away: not similar
        $this->sold('Lv 650 Dist', 'Zed', 2);            // another build
        $this->sold('Lv 650 Melee', '', 1);              // no buyer written down
        // Sold for gold with "To Gold": the trade keeps the account's name
        BusinessTransaction::create(['type' => 'gold', 'description' => 'Leblanc 648 Melee', 'notes' => 'Converted from account: c@x.com', 'sold_to' => 'Ana', 'amount' => 1, 'date' => now()->subDays(40)->toDateString()])
            ->forceFill(['archived_at' => now()->subDays(40)])->save();
        $this->leads = [['id' => 1, 'name' => 'KAI', 'method' => 'discord', 'contact' => 'kai#1', 'created_at' => 1, 'details' => []]];

        $forSale = RucoyAccount::create(['description' => 'Lv 650 Melee', 'email' => 'sell@x.com']);
        $noLevel = RucoyAccount::create(['description' => 'Mystery', 'email' => 'm@x.com']);

        $res = $this->getJson('/api/v1/business/likely-buyers')->assertOk();
        $buyers = $res->json("accounts.{$forSale->id}");

        // Most similar purchases first, then the closest level (Ana's Lv 648 beats Mia's Lv 655)
        $this->assertSame(['Kai', 'Ana', 'Mia'], array_column($buyers, 'name'));
        $this->assertSame([2, 1, 1], array_column($buyers, 'similar'));
        $this->assertSame(['method' => 'discord', 'contact' => 'kai#1'], $buyers[0]['contact']); // from their website request
        $this->assertNull($buyers[1]['contact']);
        $this->assertSame(['Leblanc 648 Melee', 648], [$buyers[1]['closest']['description'], $buyers[1]['closest']['level']]);
        $this->assertSame(['Lv 655 Melee', 655], [$buyers[2]['closest']['description'], $buyers[2]['closest']['level']]);
        $this->assertSame([], $res->json("accounts.{$noLevel->id}"));
    }

    public function test_it_works_without_the_website_connected(): void
    {
        config(['listing.site_token' => null]);
        $this->sold('Lv 640 Melee', 'Kai', 30);
        $forSale = RucoyAccount::create(['description' => 'Lv 650 Melee', 'email' => 'sell@x.com']);

        $this->getJson('/api/v1/business/likely-buyers')->assertOk()
            ->assertJsonPath("accounts.{$forSale->id}.0.name", 'Kai')
            ->assertJsonPath("accounts.{$forSale->id}.0.contact", null);
        Http::assertNothingSent();
    }

    public function test_only_traders_see_buyers(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->getJson('/api/v1/business/likely-buyers')->assertForbidden();
    }
}
