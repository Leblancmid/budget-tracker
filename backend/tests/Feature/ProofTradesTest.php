<?php

namespace Tests\Feature;

use App\Models\ProofImage;
use App\Models\ProofTrade;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Symfony\Component\Process\Process;
use Tests\TestCase;

/** Proven trades: your best trades with screenshots, published to the website's showcase. */
class ProofTradesTest extends TestCase
{
    use RefreshDatabase;

    private string $site;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create());
        Storage::fake('public');

        $this->site = storage_path('framework/testing/site-' . uniqid());
        File::ensureDirectoryExists($this->site . '/src/data');
        File::put($this->site . '/README.md', "site\n");
        foreach ([['init', '-q'], ['config', 'user.email', 't@t.t'], ['config', 'user.name', 'T'], ['add', '-A'], ['commit', '-qm', 'init']] as $args) {
            (new Process(['git', ...$args], $this->site))->mustRun();
        }
        config(['listing.site_path' => $this->site, 'listing.push' => false]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->site);
        parent::tearDown();
    }

    private function add(array $fields, int $images = 1): array
    {
        $files = array_map(fn ($i) => UploadedFile::fake()->image("discord-{$i}.png", 2400, 1200), range(1, $images));

        return $this->post('/api/v1/business/proof-trades', [...$fields, 'images' => $files], ['Accept' => 'application/json'])->assertCreated()->json();
    }

    public function test_a_trade_with_screenshots_is_saved_resized_as_webp_under_new_names(): void
    {
        $trade = $this->add(['title' => 'Top melee trade', 'value' => 9000, 'currency' => 'EUR', 'traded_on' => '2025-05-20', 'quote' => 'The goats, biggest trade in history', 'quote_by' => 'Flecha'], 2);

        $this->assertSame(['Top melee trade', 9000, 'EUR', '2025-05-20'], [$trade['title'], (int) $trade['value'], $trade['currency'], $trade['traded_on']]);
        $this->assertCount(2, $trade['images']);
        $img = $trade['images'][0];
        $this->assertSame([1600, 800], [$img['width'], $img['height']]);           // resized from 2400 × 1200
        $this->assertStringEndsWith('.webp', $img['path']);
        $this->assertStringNotContainsString('discord', $img['path']);           // never the uploaded name
        Storage::disk('public')->assertExists([$img['path'], $img['thumb_path']]);
        [$tw] = getimagesizefromstring(Storage::disk('public')->get($img['thumb_path']));
        $this->assertSame(600, $tw);
        $this->assertSame('/storage/' . $img['path'], $img['url']);
    }

    public function test_bad_files_and_fields_are_refused_before_anything_is_saved(): void
    {
        $this->post('/api/v1/business/proof-trades', ['title' => 'X', 'value' => 100, 'images' => [UploadedFile::fake()->create('a.pdf', 10, 'application/pdf')]], ['Accept' => 'application/json'])
            ->assertStatus(422)->assertJsonValidationErrors('images.0');
        // Says it's a PNG, but isn't one
        $fake = UploadedFile::fake()->createWithContent('shot.png', 'not really an image');
        $this->post('/api/v1/business/proof-trades', ['title' => 'X', 'value' => 100, 'images' => [UploadedFile::fake()->image('ok.png'), $fake]], ['Accept' => 'application/json'])
            ->assertStatus(422);
        $this->postJson('/api/v1/business/proof-trades', ['value' => -5, 'currency' => 'BTC', 'traded_on' => '2999-01-01'])
            ->assertStatus(422)->assertJsonValidationErrors(['title', 'value', 'currency', 'traded_on']);

        $this->assertSame(0, ProofTrade::count());
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_screenshots_can_be_added_reordered_and_removed(): void
    {
        $trade = $this->add(['title' => 'Trade', 'value' => 5400], 1);
        $more = $this->post("/api/v1/business/proof-trades/{$trade['id']}/images", ['images' => [UploadedFile::fake()->image('b.jpg', 800, 600)]], ['Accept' => 'application/json'])
            ->assertOk()->json('images');
        $this->assertCount(2, $more);

        // The second one becomes the cover (first)
        $this->putJson("/api/v1/business/proof-images/{$more[1]['id']}/cover")->assertOk()->assertJsonPath('images.0.id', $more[1]['id']);

        $this->deleteJson("/api/v1/business/proof-images/{$more[0]['id']}")->assertOk()->assertJsonCount(1, 'images');
        Storage::disk('public')->assertMissing($more[0]['path']);

        $this->putJson("/api/v1/business/proof-trades/{$trade['id']}", ['title' => 'Renamed', 'published' => false])->assertOk()
            ->assertJsonPath('title', 'Renamed')->assertJsonPath('published', false)->assertJsonPath('value', 5400);

        $this->deleteJson("/api/v1/business/proof-trades/{$trade['id']}")->assertOk();
        $this->assertSame([0, 0], [ProofTrade::count(), ProofImage::count()]);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_publishing_writes_the_showcase_biggest_first_with_its_images(): void
    {
        $small = $this->add(['title' => 'Distance trade', 'value' => 3700], 1);
        $big = $this->add(['title' => 'Top melee trade', 'value' => 9000, 'quote' => 'We made history.', 'quote_by' => 'Shiroe'], 2);
        $hidden = $this->add(['title' => 'Not ready', 'value' => 99999, 'published' => '0'], 1);

        $this->postJson('/api/v1/business/listing/publish')->assertOk();
        $json = json_decode(File::get($this->site . '/src/data/proofs.json'), true);

        $this->assertSame(['Top melee trade', 'Distance trade'], array_column($json, 'title')); // hidden one left out
        $this->assertSame([1, 2], array_column($json, 'rank'));
        $this->assertSame(['We made history.', 'Shiroe'], [$json[0]['quote'], $json[0]['quote_by']]);
        $this->assertCount(2, $json[0]['images']);
        $first = $json[0]['images'][0];
        $this->assertStringStartsWith('/proofs/', $first['src']);
        $this->assertFileExists($this->site . '/public' . $first['src']);
        $this->assertFileExists($this->site . '/public' . $first['thumb']);
        $this->assertSame('trade-' . $big['id'], $json[0]['id']);

        // Removing one takes it and its images off the site on the next publish
        $this->deleteJson("/api/v1/business/proof-trades/{$small['id']}")->assertOk();
        $this->postJson('/api/v1/business/listing/publish')->assertOk();
        $json = json_decode(File::get($this->site . '/src/data/proofs.json'), true);
        $this->assertSame(['Top melee trade'], array_column($json, 'title'));
        $this->assertCount(4, File::files($this->site . '/public/proofs')); // 2 images × (full + thumb)
        $this->assertNotNull($hidden);
    }

    public function test_only_storefront_users_manage_proofs(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->getJson('/api/v1/business/proof-trades')->assertForbidden();
        $this->postJson('/api/v1/business/proof-trades', ['title' => 'X', 'value' => 1])->assertForbidden();
    }
}
