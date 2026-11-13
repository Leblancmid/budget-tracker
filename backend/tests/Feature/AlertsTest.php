<?php

namespace Tests\Feature;

use App\Console\Commands\WatchLeads;
use App\Models\PushSubscription;
use App\Models\RucoyAccount;
use App\Models\Trade;
use App\Models\User;
use App\Services\PhoneAlerts;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Business alerts on the bell and the phone: new leads, things due, the weekly brief. */
class AlertsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $trader;     // Trading + Storefront
    private User $noStore;    // Trading only
    private User $daily;
    /** @var list<array{0: int, 1: string}> phone alerts "sent": [devices, payload] */
    private array $pushed = [];
    /** What the fake website answers: its leads, or null when it's down */
    private ?array $siteLeads = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->trader = User::factory()->create(['role' => 'trader']);
        $this->noStore = User::factory()->create(['role' => 'trader', 'modules' => ['daily', 'trading']]);
        $this->daily = User::factory()->create(['role' => 'daily_only']);

        config(['listing.site_token' => str_repeat('t', 40), 'listing.site_url' => 'https://site.test']);
        config(['services.webpush.public_key' => 'pub', 'services.webpush.private_key' => 'priv']);
        PhoneAlerts::$sender = function ($devices, string $payload) {
            $this->pushed[] = [$devices->count(), $payload];

            return $devices->count();
        };
        Cache::forget(WatchLeads::SEEN_KEY);
        Http::fake(fn () => $this->siteLeads === null
            ? Http::response(['message' => 'down'], 500)
            : Http::response(['leads' => $this->siteLeads]));
    }

    protected function tearDown(): void
    {
        PhoneAlerts::$sender = null;
        parent::tearDown();
    }

    private function websiteHas(array $leads): void
    {
        $this->siteLeads = $leads;
    }

    private function titles(User $u): array
    {
        return $u->fresh()->notifications()->get()->map(fn ($n) => $n->data['title'])->all();
    }

    public function test_new_leads_reach_everyone_with_the_storefront_once_without_names(): void
    {
        $this->websiteHas([['id' => 7, 'type' => 'account', 'name' => 'Kai', 'contact' => 'kai#1', 'details' => ['title' => 'Lv 700 Dist']]]);
        $this->artisan('leads:watch')->assertSuccessful();
        $this->assertSame([], $this->titles($this->trader), 'the first run only takes note');

        $this->websiteHas([
            ['id' => 7, 'type' => 'account', 'name' => 'Kai', 'contact' => 'kai#1', 'details' => ['title' => 'Lv 700 Dist']],
            ['id' => 8, 'type' => 'gold', 'name' => 'Mia', 'contact' => '0917', 'details' => ['amount_kk' => 500, 'payment' => 'GCash']],
        ]);
        $this->artisan('leads:watch')->assertSuccessful();
        $this->artisan('leads:watch')->assertSuccessful(); // nothing new the second time

        $this->assertSame(['New gold order'], $this->titles($this->trader));
        $this->assertSame(['New gold order'], $this->titles($this->admin));
        $this->assertSame([], $this->titles($this->noStore));
        $this->assertSame([], $this->titles($this->daily));
        $n = $this->trader->notifications()->first()->data;
        $this->assertSame('500 KK · GCash', $n['body']);
        $this->assertSame('/business/leads', $n['url']);
        $this->assertStringNotContainsString('Mia', json_encode($n));
    }

    public function test_many_new_leads_become_one_alert_and_a_website_outage_is_quiet(): void
    {
        $this->websiteHas([['id' => 1, 'type' => 'gold', 'details' => []]]);
        $this->artisan('leads:watch');
        $this->websiteHas(array_map(fn ($i) => ['id' => $i, 'type' => 'gold', 'details' => []], range(1, 6)));
        $this->artisan('leads:watch');
        $this->assertSame(['5 new leads'], $this->titles($this->trader));

        $this->siteLeads = null;
        $this->artisan('leads:watch')->assertSuccessful();
    }

    public function test_morning_alerts_for_trades_and_payments_due_and_mondays_brief_once_a_day(): void
    {
        Trade::create(['description' => 'KKS with Ren', 'status' => 'kks', 'amount' => 100, 'completion_date' => '2026-11-16']);
        Trade::create(['description' => 'Cash with Ivy', 'status' => 'cash', 'amount' => 100, 'completion_date' => '2026-11-14']);
        Trade::create(['description' => 'Later', 'status' => 'kks', 'amount' => 100, 'completion_date' => '2026-11-20']);
        RucoyAccount::create(['email' => 'a@example.com', 'description' => 'Lv 650', 'payment_status' => 'partially_paid', 'payment_date' => '2026-11-15']);
        RucoyAccount::create(['email' => 'b@example.com', 'description' => 'Lv 600', 'payment_status' => 'fully_paid', 'payment_date' => '2026-11-15']);

        $this->artisan('business:alerts', ['--date' => '2026-11-16'])->assertSuccessful(); // a Monday
        $this->artisan('business:alerts', ['--date' => '2026-11-16'])->assertSuccessful(); // again: nothing new

        $titles = $this->titles($this->noStore);
        $this->assertEqualsCanonicalizing(['Trades to complete: 1 due today, 1 overdue', 'A payment is due', 'Your weekly brief is ready'], $titles);
        $this->assertSame([], $this->titles($this->daily));
        $trades = $this->noStore->notifications()->get()->firstWhere('data.kind', 'trades')->data;
        $this->assertSame('KKS with Ren, Cash with Ivy', $trades['body']);

        // Tuesday: no brief, but still due
        $this->artisan('business:alerts', ['--date' => '2026-11-17'])->assertSuccessful();
        $this->assertCount(5, $this->titles($this->noStore));
    }

    public function test_alerts_go_to_the_phones_of_people_who_turned_them_on(): void
    {
        PushSubscription::create(['user_id' => $this->trader->id, 'endpoint' => 'https://push.example/abc', 'endpoint_hash' => PushSubscription::hashOf('https://push.example/abc'), 'public_key' => 'k', 'auth_token' => 'a']);
        Trade::create(['description' => 'KKS', 'status' => 'kks', 'amount' => 1, 'completion_date' => '2026-11-17']);

        $this->artisan('business:alerts', ['--date' => '2026-11-17'])->assertSuccessful();

        $this->assertCount(1, $this->pushed, 'only the trader has a device');
        $this->assertSame(1, $this->pushed[0][0]);
        $this->assertSame(['title' => 'Trades to complete: 1 due today', 'body' => 'KKS', 'url' => '/rucoy/trades'], json_decode($this->pushed[0][1], true));
    }

    public function test_turning_phone_alerts_on_and_off_for_a_device(): void
    {
        Sanctum::actingAs($this->daily);
        $this->getJson('/api/v1/profile/push')->assertOk()->assertJsonPath('configured', true)->assertJsonPath('public_key', 'pub');

        $sub = ['endpoint' => 'https://web.push.apple.com/xyz', 'keys' => ['p256dh' => 'BKey', 'auth' => 'auth1']];
        $this->postJson('/api/v1/profile/push', $sub)->assertCreated();
        $this->postJson('/api/v1/profile/push', $sub)->assertCreated(); // again: still one device
        $this->assertSame(1, PushSubscription::count());
        $this->postJson('/api/v1/profile/push/test')->assertOk()->assertJsonPath('message', 'Sent to 1 device.');

        $this->postJson('/api/v1/profile/push', ['endpoint' => 'http://192.168.1.5/x', 'keys' => ['p256dh' => 'a', 'auth' => 'b']])->assertUnprocessable();
        $this->deleteJson('/api/v1/profile/push', ['endpoint' => $sub['endpoint']])->assertOk();
        $this->assertSame(0, PushSubscription::count());
    }

    public function test_without_keys_phone_alerts_are_off_but_the_bell_still_works(): void
    {
        config(['services.webpush.public_key' => null, 'services.webpush.private_key' => null]);
        Sanctum::actingAs($this->trader);
        $this->getJson('/api/v1/profile/push')->assertOk()->assertJsonPath('configured', false);
        $this->postJson('/api/v1/profile/push', ['endpoint' => 'https://push.example/1', 'keys' => ['p256dh' => 'a', 'auth' => 'b']])->assertStatus(409);

        Trade::create(['description' => 'KKS', 'status' => 'kks', 'amount' => 1, 'completion_date' => '2026-11-17']);
        $this->artisan('business:alerts', ['--date' => '2026-11-17'])->assertSuccessful();
        $this->assertSame([], $this->pushed);
        $this->assertCount(1, $this->titles($this->trader));
    }
}
