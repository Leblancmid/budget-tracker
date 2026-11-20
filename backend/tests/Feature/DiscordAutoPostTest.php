<?php

namespace Tests\Feature;

use App\Models\DiscordPost;
use App\Models\RucoyAccount;
use App\Models\User;
use App\Services\DiscordAutoPost;
use App\Services\ListingAnnouncer;
use App\Services\PhoneAlerts;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Discord auto-post: the saved Listing Kit image at 10 AM and 10 PM Manila. */
class DiscordAutoPostTest extends TestCase
{
    use RefreshDatabase;

    private User $trader;

    /** The fake Discord's message numbers */
    private int $messageNo = 0;

    /** What the fake website reports per Discord server */
    private array $sources = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->trader = User::factory()->create(['role' => 'trader']);
        Sanctum::actingAs($this->trader);
        Storage::fake('public');
        Storage::fake('local');
        config(['listing.site_url' => 'https://site.test', 'listing.discord_webhook' => 'https://discord.test/api/webhooks/1/abc']);
        config(['services.webpush.public_key' => null]);
        PhoneAlerts::$sender = fn ($devices) => $devices->count();
        Http::fake(fn (Request $r) => match (true) {
            str_contains($r->url(), 'webhooks/7/deleted') => Http::response(['message' => 'Unknown Webhook'], 404), // a webhook someone deleted
            // The website's stats: visitors and requests per Discord server
            str_contains($r->url(), 'site.test/api/stats') => Http::response(['sources' => $this->sources, 'listing_views' => []]),
            // Reading a webhook: its name and where it posts
            $r->method() === 'GET' && str_contains($r->url(), 'discord.test') => Http::response(['name' => 'Leblanc', 'guild_id' => '111', 'channel_id' => '222']),
            // Deleting an earlier post
            $r->method() === 'DELETE' && str_contains($r->url(), 'discord.test') => Http::response(null, 204),
            // A post: Discord answers with the new message (wait=true)
            str_contains($r->url(), 'discord.test') => Http::response(['id' => (string) (++$this->messageNo + 1000)]),
            default                                         => Http::response([], 404),
        });
    }

    protected function tearDown(): void
    {
        PhoneAlerts::$sender = null;
        parent::tearDown();
    }

    private function listed(string $name): RucoyAccount
    {
        Storage::disk('public')->put("accounts/{$name}.jpg", 'img');

        return RucoyAccount::create(['description' => $name, 'email' => strtolower(str_replace(' ', '', $name)) . '@x.com', 'screenshot' => "accounts/{$name}.jpg", 'listed_at' => now()]);
    }

    private function switchOn()
    {
        return $this->post('/api/v1/business/listing/discord-auto', ['enabled' => '1', 'image' => UploadedFile::fake()->image('mine.png', 800, 600)], ['Accept' => 'application/json']);
    }

    private function discordPosts(): int
    {
        return Http::recorded()->filter(fn ($pair) => $pair[0]->method() === 'POST' && str_contains($pair[0]->url(), 'discord.test'))->count();
    }

    /** The messages deleted on the fake Discord, as "webhook/message" */
    private function deleted(): array
    {
        return Http::recorded()->filter(fn ($pair) => $pair[0]->method() === 'DELETE')
            ->map(fn ($pair) => preg_replace('#^https://discord\.test/api/webhooks/(\d+)/\w+/messages/(\d+)$#', '$1/$2', $pair[0]->url()))
            ->values()->all();
    }

    public function test_each_post_replaces_the_one_before_it_in_that_channel(): void
    {
        config(['listing.discord_webhook' => 'https://discord.test/api/webhooks/1/abc,https://discord.test/api/webhooks/2/def']);
        $this->listed('Lv 650 Melee');
        $this->switchOn()->assertOk();

        $this->artisan('listings:discord-auto')->assertSuccessful(); // messages 1001 (ch 1), 1002 (ch 2)
        $this->assertSame([], $this->deleted(), 'nothing before the first post');

        $two = collect($this->getJson('/api/v1/business/discord-posts')->json('channels'))->firstWhere('no', 2)['key'];
        $this->postJson("/api/v1/business/discord-posts/{$two}/send")->assertOk(); // 1003 in channel 2 only
        $this->assertSame(['2/1002'], $this->deleted());

        $this->artisan('listings:discord-auto')->assertSuccessful(); // 1004, 1005: replace 1001 and 1003
        $this->assertEqualsCanonicalizing(['2/1002', '1/1001', '2/1003'], $this->deleted());
        $this->assertSame(2, DiscordPost::whereNotNull('message_id')->count(), 'only the latest post per channel is still up');
    }

    public function test_switching_on_saves_the_image_and_the_schedule_posts_it(): void
    {
        $this->listed('Lv 650 Melee');
        $this->switchOn()->assertOk()->assertJsonPath('enabled', true)->assertJsonPath('stale', false);
        $this->getJson('/api/v1/business/listing/publish')->assertJsonPath('discord_auto.enabled', true);

        $this->artisan('listings:discord-auto')->expectsOutputToContain('Posted to 1 of 1')->assertSuccessful();
        $this->assertSame(1, $this->discordPosts());
        $this->assertNotNull(DiscordAutoPost::status()['posted_at']);

        // Off: nothing goes out
        $this->postJson('/api/v1/business/listing/discord-auto', ['enabled' => false])->assertOk()->assertJsonPath('enabled', false);
        $this->artisan('listings:discord-auto')->expectsOutputToContain('off')->assertSuccessful();
        $this->assertSame(1, $this->discordPosts());
    }

    public function test_it_runs_at_10_am_and_10_pm_manila(): void
    {
        $event = collect(app(Schedule::class)->events())->first(fn ($e) => str_contains($e->command, 'listings:discord-auto'));
        $this->assertSame('0 10,22 * * *', $event->expression);
        $this->assertSame('Asia/Manila', $event->timezone);

        $this->travelTo(now('Asia/Manila')->setTime(15, 30));
        $this->assertSame('22:00', DiscordAutoPost::nextAt()->format('H:i'));
        $this->travelTo(now('Asia/Manila')->setTime(23, 0));
        $this->assertSame('10:00', DiscordAutoPost::nextAt()->format('H:i'));
    }

    public function test_a_sold_account_stops_the_old_picture_and_alerts_you(): void
    {
        $sold = $this->listed('Lv 650 Melee');
        $this->listed('Lv 600 Dist');
        $this->switchOn()->assertOk();

        $sold->forceFill(['archived_at' => now()])->save(); // sold: the saved picture still shows it
        $this->assertTrue(DiscordAutoPost::status()['stale']);
        $this->artisan('listings:discord-auto')->expectsOutputToContain('Skipped')->assertSuccessful();
        $this->assertSame(0, $this->discordPosts());
        $this->assertSame('Discord auto-post skipped', $this->trader->fresh()->notifications()->first()?->data['title']);

        // Posting a fresh picture from the app refreshes it
        $this->post('/api/v1/business/listing/discord', ['image' => UploadedFile::fake()->image('x.png', 800, 600)], ['Accept' => 'application/json'])->assertOk();
        $this->assertFalse(DiscordAutoPost::status()['stale']);
        $this->artisan('listings:discord-auto')->expectsOutputToContain('Posted')->assertSuccessful();
    }

    public function test_switching_on_needs_the_image_and_discord_set_up(): void
    {
        $this->postJson('/api/v1/business/listing/discord-auto', ['enabled' => true])->assertStatus(422)->assertJsonValidationErrors('image');
        $this->postJson('/api/v1/business/listing/discord-auto', [])->assertStatus(422)->assertJsonValidationErrors('enabled');

        config(['listing.discord_webhook' => '']);
        $this->switchOn()->assertStatus(422);
        $this->assertFalse(DiscordAutoPost::status()['enabled']);
    }

    public function test_ten_servers_all_get_it_and_a_deleted_webhook_is_reported_by_number(): void
    {
        config(['listing.discord_webhook' => collect(range(1, 10))->map(fn ($n) => "https://discord.test/api/webhooks/{$n}/" . ($n === 7 ? 'deleted' : 'abc'))->join(',')]);
        $this->listed('Lv 650 Melee');
        $this->switchOn()->assertOk();

        $this->artisan('listings:discord-auto')->expectsOutputToContain('Posted to 9 of 10')->assertSuccessful();
        $this->assertSame(10, $this->discordPosts());
        $alert = $this->trader->fresh()->notifications()->first()?->data;
        $this->assertSame('Discord auto-post reached 9 of 10 channels', $alert['title']);
        $this->assertStringContainsString('Channel 7 refused', $alert['body']);
        $this->assertStringNotContainsString('webhooks', $alert['body']); // never the link
    }

    public function test_the_discord_page_shows_each_server_morning_and_evening(): void
    {
        config(['listing.discord_webhook' => 'https://discord.test/api/webhooks/1/abc,https://discord.test/api/webhooks/7/deleted']);
        $this->listed('Lv 650 Melee');
        $this->switchOn()->assertOk();

        $this->travelTo(now('Asia/Manila')->setTime(10, 0));
        $this->artisan('listings:discord-auto')->assertSuccessful();   // morning: 1 of 2
        $this->travelTo(now('Asia/Manila')->setTime(22, 0));
        RucoyAccount::query()->update(['archived_at' => now()]);       // sold: the evening run is skipped
        $this->artisan('listings:discord-auto')->assertSuccessful();

        $page = $this->getJson('/api/v1/business/discord-posts')->assertOk()->json();
        [$one, $seven] = $page['channels'];
        $this->assertSame([1, 2], [$one['no'], $seven['no']]);
        $this->assertFalse($seven['alive']);                           // Discord says it's gone
        $this->assertNotNull($one['last_sent_at']);
        $this->assertStringNotContainsString('webhooks', json_encode($page)); // never the links

        $today = $page['days'][0];
        $this->assertSame(now('Asia/Manila')->toDateString(), $today['date']);
        $this->assertTrue($today['am']['results'][$one['key']]['ok']);
        $this->assertSame('Webhook deleted', $today['am']['results'][$seven['key']]['note']);
        $this->assertStringContainsString('changed', $today['pm']['skipped']);
        $this->assertTrue($today['am']['due'] && $today['pm']['due']);
        $this->assertFalse($page['days'][1]['am']['results'] !== [], 'nothing the day before');
    }

    public function test_send_posts_the_saved_picture_to_just_that_server(): void
    {
        config(['listing.discord_webhook' => 'https://discord.test/api/webhooks/1/abc,https://discord.test/api/webhooks/2/def,https://discord.test/api/webhooks/7/deleted']);
        $this->listed('Lv 650 Melee');
        $channels = fn () => $this->getJson('/api/v1/business/discord-posts')->json('channels');
        [, $two, $seven] = $channels();

        // Nothing saved yet
        $this->postJson("/api/v1/business/discord-posts/{$two['key']}/send")->assertStatus(422);
        $this->getJson('/api/v1/business/discord-posts/image')->assertNotFound();

        $this->switchOn()->assertOk(); // saves the picture
        $this->get('/api/v1/business/discord-posts/image')->assertOk()->assertHeader('Content-Type', 'image/png');

        $this->postJson("/api/v1/business/discord-posts/{$two['key']}/send")->assertOk()->assertJsonPath('message', 'Sent.');
        $posted = Http::recorded()->map(fn ($pair) => $pair[0])->filter(fn ($r) => $r->method() === 'POST' && str_contains($r->url(), 'discord.test'))->values();
        $this->assertCount(1, $posted);
        $this->assertStringContainsString('webhooks/2/def', $posted[0]->url()); // only that one

        $this->postJson("/api/v1/business/discord-posts/{$seven['key']}/send")->assertStatus(502); // deleted webhook
        $this->postJson('/api/v1/business/discord-posts/0123456789abcdef/send')->assertNotFound();  // not one of yours

        $own = $this->getJson('/api/v1/business/discord-posts')->json('own');
        $this->assertSame([['single', 0, 1, $seven['key']], ['single', 1, 1, $two['key']]],
            array_map(fn ($p) => [$p['kind'], $p['sent'], $p['total'], $p['channel_key']], $own));
        $this->assertNotNull(collect($channels())->firstWhere('no', 2)['last_sent_at']);

        // Sold since: it won't send the old picture
        RucoyAccount::query()->update(['archived_at' => now()]);
        $this->postJson("/api/v1/business/discord-posts/{$two['key']}/send")->assertStatus(422)->assertJsonPath('message', fn ($m) => str_contains($m, 'changed'));
    }

    public function test_the_discord_page_posts_the_saved_picture_to_all_and_switches_auto_post(): void
    {
        config(['listing.discord_webhook' => 'https://discord.test/api/webhooks/1/abc,https://discord.test/api/webhooks/2/def']);
        $this->listed('Lv 650 Melee');
        $this->postJson('/api/v1/business/discord-posts/send-all')->assertStatus(422); // no picture yet

        // A picture saved from the Listing Kit ("Post image to Discord")
        $this->post('/api/v1/business/listing/discord', ['image' => UploadedFile::fake()->image('x.png', 800, 600)], ['Accept' => 'application/json'])->assertOk();
        $this->postJson('/api/v1/business/listing/discord-auto', ['enabled' => false])->assertOk();

        // Switch on from the Discord page: no image sent, the saved one is used
        $this->postJson('/api/v1/business/listing/discord-auto', ['enabled' => true])->assertOk()->assertJsonPath('enabled', true);
        $this->artisan('listings:discord-auto')->expectsOutputToContain('Posted to 2 of 2')->assertSuccessful();

        $this->postJson('/api/v1/business/discord-posts/send-all')->assertOk()->assertJsonPath('sent', 2)->assertJsonPath('total', 2);
        $this->assertSame('manual', $this->getJson('/api/v1/business/discord-posts')->json('own.0.kind'));

        RucoyAccount::query()->update(['archived_at' => now()]); // sold: the picture is out of date
        $this->postJson('/api/v1/business/discord-posts/send-all')->assertStatus(422);
    }

    public function test_each_server_gets_auto_posts_on_its_own_schedule(): void
    {
        config(['listing.discord_webhook' => collect(range(1, 4))->map(fn ($n) => "https://discord.test/api/webhooks/{$n}/abc")->join(',')]);
        $this->listed('Lv 650 Melee');
        $this->switchOn()->assertOk();
        $keys = collect($this->getJson('/api/v1/business/discord-posts')->json('channels'))->pluck('key', 'no');
        $this->assertSame(['both', true], [$this->getJson('/api/v1/business/discord-posts')->json('channels.0.schedule'), $this->getJson('/api/v1/business/discord-posts')->json('channels.0.replace')]);

        // 1: both (default) · 2: mornings only · 3: evenings only · 4: never auto-posted, keeps every post
        $this->putJson("/api/v1/business/discord-posts/{$keys[2]}", ['schedule' => 'am'])->assertOk()->assertJsonPath('schedule', 'am')->assertJsonPath('replace', true);
        $this->putJson("/api/v1/business/discord-posts/{$keys[3]}", ['schedule' => 'pm'])->assertOk();
        $this->putJson("/api/v1/business/discord-posts/{$keys[4]}", ['schedule' => 'manual', 'replace' => false])->assertOk()->assertJsonPath('replace', false);
        $this->putJson("/api/v1/business/discord-posts/{$keys[1]}", ['schedule' => 'weekly'])->assertStatus(422)->assertJsonValidationErrors('schedule');

        $postedTo = function () {
            $hooks = Http::recorded()->filter(fn ($pair) => $pair[0]->method() === 'POST' && str_contains($pair[0]->url(), 'discord.test'))
                ->map(fn ($pair) => (int) preg_replace('#^.*/webhooks/(\d+)/.*$#', '$1', $pair[0]->url()))->sort()->values()->all();

            return $hooks;
        };

        $this->travelTo(now('Asia/Manila')->setTime(10, 0));
        $this->artisan('listings:discord-auto')->expectsOutputToContain('Posted to 2 of 2')->assertSuccessful();
        $this->assertSame([1, 2], $postedTo());

        $this->travelTo(now('Asia/Manila')->setTime(22, 0));
        $this->artisan('listings:discord-auto')->expectsOutputToContain('Posted to 2 of 2')->assertSuccessful();
        $this->assertSame([1, 1, 2, 3], $postedTo());

        // A manual-only server still gets Send and Post to all, and keeps its earlier post
        $this->postJson("/api/v1/business/discord-posts/{$keys[4]}/send")->assertOk();
        $this->postJson("/api/v1/business/discord-posts/{$keys[4]}/send")->assertOk();
        $this->assertFalse(Http::recorded()->contains(fn ($pair) => $pair[0]->method() === 'DELETE' && str_contains($pair[0]->url(), 'webhooks/4/')));

        // Nobody set for mornings: that run posts nothing
        foreach ([1, 2] as $n) {
            $this->putJson("/api/v1/business/discord-posts/{$keys[$n]}", ['schedule' => 'pm'])->assertOk();
        }
        $this->travelTo(now('Asia/Manila')->addDay()->setTime(10, 0));
        $this->artisan('listings:discord-auto')->expectsOutputToContain('No server is set')->assertSuccessful();
    }

    public function test_each_server_links_with_its_own_tag_and_shows_who_it_brings(): void
    {
        config(['listing.discord_webhook' => 'https://discord.test/api/webhooks/1/abc,https://discord.test/api/webhooks/2/def']);
        $this->listed('Lv 650 Melee');
        $this->switchOn()->assertOk();
        $this->artisan('listings:discord-auto')->assertSuccessful();

        // Each server's "Browse accounts" (and plain link) carries its own tag
        $tag  = fn (string $hook) => 'd-' . substr(ListingAnnouncer::channelKey($hook), 0, 6);
        $urls = Http::recorded()->filter(fn ($pair) => $pair[0]->method() === 'POST')->mapWithKeys(fn ($pair) => [
            (string) preg_replace('#^.*/webhooks/(\d+)/.*$#', '$1', $pair[0]->url()) => json_decode(collect($pair[0]->data())->keyBy('name')['payload_json']['contents'], true)['components'][0]['components'][0]['url'],
        ]);
        $this->assertSame('https://site.test/for-sale?from=' . $tag('https://discord.test/api/webhooks/1/abc'), $urls['1']);
        $this->assertSame('https://site.test/for-sale?from=' . $tag('https://discord.test/api/webhooks/2/def'), $urls['2']);
        $this->assertNotSame($urls['1'], $urls['2']);
        $this->assertStringNotContainsString('abc', $urls['1']); // nothing of the webhook link

        // Website stats off: no numbers
        $this->assertNull($this->getJson('/api/v1/business/discord-posts')->json('channels.0.reach'));

        // On: each server's visitors and requests (a server with none shows zeros)
        config(['listing.site_token' => str_repeat('t', 40)]);
        $this->sources = [['source' => $tag('https://discord.test/api/webhooks/1/abc'), 'visitors_7' => 4, 'visitors_30' => 12, 'requests_30' => 2]];
        $channels = $this->getJson('/api/v1/business/discord-posts')->json('channels');
        $this->assertSame(['visitors_7' => 4, 'visitors_30' => 12, 'requests_30' => 2], $channels[0]['reach']);
        $this->assertSame(['visitors_7' => 0, 'visitors_30' => 0, 'requests_30' => 0], $channels[1]['reach']);
    }

    public function test_servers_can_be_named_in_the_app_and_opened_in_discord(): void
    {
        config(['listing.discord_webhook' => 'https://discord.test/api/webhooks/1/abc,https://discord.test/api/webhooks/2/def']);
        [$one, $two] = $this->getJson('/api/v1/business/discord-posts')->json('channels');
        $this->assertSame(['Leblanc', null, 'https://discord.com/channels/111/222'], [$one['name'], $one['label'], $one['open_url']]);

        $this->putJson("/api/v1/business/discord-posts/{$one['key']}", ['name' => '  Asian Market '])->assertOk()->assertJsonPath('label', 'Asian Market');
        $this->putJson("/api/v1/business/discord-posts/{$two['key']}", ['name' => 'Latam Market'])->assertOk();
        $labels = collect($this->getJson('/api/v1/business/discord-posts')->json('channels'))->pluck('label')->all();
        $this->assertSame(['Asian Market', 'Latam Market'], $labels);

        // Empty: back to the default; too long or missing: refused; not one of yours: 404
        $this->putJson("/api/v1/business/discord-posts/{$two['key']}", ['name' => ''])->assertOk()->assertJsonPath('label', null);
        $this->putJson("/api/v1/business/discord-posts/{$one['key']}", ['name' => str_repeat('x', 41)])->assertStatus(422)->assertJsonValidationErrors('name');
        $this->putJson("/api/v1/business/discord-posts/{$one['key']}", [])->assertOk()->assertJsonPath('label', 'Asian Market'); // nothing sent: nothing changes
        $this->putJson('/api/v1/business/discord-posts/0123456789abcdef', ['name' => 'X'])->assertNotFound();
    }

    public function test_a_daily_only_user_cant_switch_it_or_see_the_posts(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->switchOn()->assertForbidden();
        $this->getJson('/api/v1/business/discord-posts')->assertForbidden();
        $this->getJson('/api/v1/business/discord-posts/image')->assertForbidden();
        $this->postJson('/api/v1/business/discord-posts/0123456789abcdef/send')->assertForbidden();
        $this->putJson('/api/v1/business/discord-posts/0123456789abcdef', ['name' => 'X'])->assertForbidden();
        $this->postJson('/api/v1/business/discord-posts/send-all')->assertForbidden();
    }
}
