<?php

namespace Tests\Feature;

use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Symfony\Component\Process\Process;
use Tests\TestCase;

/** Publishing the accounts for sale into a throwaway copy of the website repo (no push). */
class ListingPublishTest extends TestCase
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

    private function account(array $attrs, bool $shot = true): RucoyAccount
    {
        return RucoyAccount::create([
            'email' => uniqid() . '@x.com', 'listed_at' => now(),
            'screenshot' => $shot ? UploadedFile::fake()->image('s.jpg')->store('screenshots', 'public') : null,
            ...$attrs,
        ]);
    }

    private function published(): array
    {
        return json_decode(File::get($this->site . '/src/data/listings.json'), true);
    }

    public function test_publish_writes_unsold_listings_with_prices_only_when_shown_and_commits(): void
    {
        $shown  = $this->account(['description' => 'Leblanc 700 Dist', 'level' => 700, 'melee' => 300, 'distance' => 650, 'magic' => 100, 'defense' => 550, 'price' => 3_600_000_000, 'show_price' => true]);
        $hidden = $this->account(['description' => 'Leblanc 640 Melee', 'price' => 900_000_000, 'show_price' => false]);
        $this->account(['description' => 'No screenshot 600 Dist'], shot: false);
        $sold = $this->account(['description' => 'Leblanc 650 Magic']);
        $sold->forceFill(['archived_at' => now()])->save();

        $this->getJson('/api/v1/business/listing/publish')->assertOk()
            ->assertJsonCount(2, 'listings')->assertJsonPath('skipped.0.reason', 'No screenshot');

        $res = $this->postJson('/api/v1/business/listing/publish')->assertOk()
            ->assertJsonPath('count', 2)->assertJsonPath('changed', true)->assertJsonPath('pushed', false);
        $this->assertNotNull($res->json('commit'));

        $json = $this->published();
        $this->assertSame("acc-{$shown->id}", $json[0]['id']);
        $this->assertSame('3.6KKK', $json[0]['price']);
        $this->assertSame(['melee' => 300, 'distance' => 650, 'magic' => 100, 'defense' => 550], $json[0]['stats']);
        $this->assertTrue($json[0]['featured']);
        $this->assertArrayNotHasKey('price', $json[1]);   // Show price off → "On request"
        $this->assertArrayNotHasKey('stats', $json[1]);   // no stats entered
        $this->assertSame(['Melee', 640], [$json[1]['category'], $json[1]['level']]); // read from the name
        $this->assertArrayNotHasKey('hp', $json[0]);
        $this->assertFileExists($this->site . "/public/listings/acc-{$hidden->id}.jpg");

        // Selling one removes it and its image on the next publish
        $hidden->forceFill(['archived_at' => now()])->save();
        $this->postJson('/api/v1/business/listing/publish')->assertOk()->assertJsonPath('count', 1);
        $this->assertCount(1, $this->published());
        $this->assertFileDoesNotExist($this->site . "/public/listings/acc-{$hidden->id}.jpg");

        // Nothing changed → no new commit
        $this->postJson('/api/v1/business/listing/publish')->assertOk()->assertJsonPath('changed', false)->assertJsonPath('commit', null);
    }

    public function test_other_work_in_the_site_repo_is_never_committed(): void
    {
        $this->account(['description' => 'Leblanc 700 Dist']);
        File::put($this->site . '/README.md', "work in progress\n");

        $this->postJson('/api/v1/business/listing/publish')->assertOk();

        $status = (new Process(['git', 'status', '--porcelain'], $this->site))->mustRun()->getOutput();
        $this->assertStringContainsString('README.md', $status);
    }

    public function test_publishing_needs_the_site_path_and_is_admin_only(): void
    {
        config(['listing.site_path' => null]);
        $this->postJson('/api/v1/business/listing/publish')->assertStatus(422);
        $this->getJson('/api/v1/business/listing/publish')->assertJsonPath('configured', false);

        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->postJson('/api/v1/business/listing/publish')->assertForbidden();
    }
}
