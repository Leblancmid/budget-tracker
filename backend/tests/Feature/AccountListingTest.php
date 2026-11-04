<?php

namespace Tests\Feature;

use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountListingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create());
    }

    private function stats(): array
    {
        return ['level' => 618, 'melee' => 602, 'distance' => 378, 'magic' => 485, 'defense' => 552];
    }

    public function test_daily_only_users_cannot_reach_business_data(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));

        foreach (['/api/v1/rucoy/accounts', '/api/v1/business/dashboard', '/api/v1/master/dashboard', '/api/v1/logs', '/api/v1/reports/business'] as $url) {
            $this->getJson($url)->assertForbidden();
        }
        $this->postJson('/api/v1/rucoy/accounts', ['email' => 'x@example.com'])->assertForbidden();

        // Their own Daily Expenses still work
        $this->getJson('/api/v1/dashboard')->assertOk();
        $this->getJson('/api/v1/reports/daily-expenses')->assertOk();
    }

    public function test_guests_are_rejected(): void
    {
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/v1/rucoy/accounts')->assertUnauthorized();
    }

    public function test_account_is_created_with_stats_screenshot_and_listed_now(): void
    {
        $this->freezeSecond();

        $res = $this->post('/api/v1/rucoy/accounts', [
            'description' => 'Lv 618 Melee',
            'email'      => 'acc@example.com',
            'price'      => 700_000_000,
            'show_price' => '1',
            'screenshot' => UploadedFile::fake()->image('../../evil name.png', 1200, 800),
            ...$this->stats(),
        ], ['Accept' => 'application/json'])->assertCreated()
            ->assertJsonPath('level', 618)
            ->assertJsonPath('defense', 552)
            ->assertJsonPath('show_price', true);

        $account = RucoyAccount::firstOrFail();
        $this->assertTrue($account->listed_at->equalTo(now()));

        // Stored under a generated name in screenshots/, never the uploaded file name
        $this->assertStringStartsWith('screenshots/', $account->screenshot);
        $this->assertStringNotContainsString('evil', $account->screenshot);
        Storage::disk('public')->assertExists($account->screenshot);
        $this->assertStringEndsWith($account->screenshot, $res->json('screenshot'));
    }

    public function test_listing_fields_are_validated(): void
    {
        $this->post('/api/v1/rucoy/accounts', [
            'description' => 'Lv 618 Melee',
            'email'      => 'acc@example.com',
            'level'      => 0,
            'melee'      => -1,
            'magic'      => 'lots',
            'show_price' => 'maybe',
            'screenshot' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
        ], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['level', 'melee', 'magic', 'show_price', 'screenshot']);

        $this->post('/api/v1/rucoy/accounts', [
            'description' => 'Lv 618 Melee',
            'email'      => 'acc@example.com',
            'screenshot' => UploadedFile::fake()->image('huge.png')->size(6000),
        ], ['Accept' => 'application/json'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['screenshot']);

        // The column is NOT NULL: a missing description is a 422, not a 500
        $this->postJson('/api/v1/rucoy/accounts', ['email' => 'acc@example.com'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['description']);

        $this->assertSame(0, RucoyAccount::count());
    }

    public function test_replacing_and_removing_a_screenshot_cleans_up_files(): void
    {
        $this->post('/api/v1/rucoy/accounts', [
            'description' => 'Lv 618 Melee',
            'email'      => 'acc@example.com',
            'screenshot' => UploadedFile::fake()->image('a.png'),
        ], ['Accept' => 'application/json'])->assertCreated();
        $account = RucoyAccount::firstOrFail();
        $first   = $account->screenshot;
        $listed  = $account->listed_at;

        // Replace: old file goes, new one stays; a partial update keeps other fields
        $this->post("/api/v1/rucoy/accounts/{$account->id}", [
            '_method'    => 'PUT',
            'screenshot' => UploadedFile::fake()->image('b.png'),
            'level'      => 700,
        ], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('level', 700);

        $account->refresh();
        Storage::disk('public')->assertMissing($first);
        Storage::disk('public')->assertExists($account->screenshot);
        $this->assertSame('acc@example.com', $account->email);
        $this->assertTrue($account->listed_at->equalTo($listed));

        // Remove
        $second = $account->screenshot;
        $this->putJson("/api/v1/rucoy/accounts/{$account->id}", ['remove_screenshot' => true])
            ->assertOk()->assertJsonPath('screenshot', null);
        Storage::disk('public')->assertMissing($second);

        // Deleting the account deletes its screenshot too
        $this->post("/api/v1/rucoy/accounts/{$account->id}", ['_method' => 'PUT', 'screenshot' => UploadedFile::fake()->image('c.png')], ['Accept' => 'application/json'])->assertOk();
        $third = $account->fresh()->screenshot;
        $this->deleteJson("/api/v1/rucoy/accounts/{$account->id}")->assertOk();
        Storage::disk('public')->assertMissing($third);
    }

    public function test_accessories_are_saved_cleared_and_validated(): void
    {
        // Multipart, as the app sends it
        $id = $this->post('/api/v1/rucoy/accounts', [
            'description' => 'Lv 721 Distance',
            'email'       => 'acc@example.com',
            'accessories' => ['crown', 'ring-green', 'necklace-green'],
        ], ['Accept' => 'application/json'])->assertCreated()
            ->assertJsonPath('accessories', ['crown', 'ring-green', 'necklace-green'])
            ->json('id');

        // Unknown or repeated items are rejected
        $this->putJson("/api/v1/rucoy/accounts/{$id}", ['accessories' => ['crown', 'wings']])
            ->assertStatus(422)->assertJsonValidationErrors(['accessories.1']);
        $this->putJson("/api/v1/rucoy/accounts/{$id}", ['accessories' => ['crown', 'crown']])
            ->assertStatus(422);

        // A partial update leaves them alone
        $this->putJson("/api/v1/rucoy/accounts/{$id}", ['show_price' => true])
            ->assertOk()->assertJsonPath('accessories', ['crown', 'ring-green', 'necklace-green']);

        // An empty value (what the app sends when all are unticked) clears them
        $this->post("/api/v1/rucoy/accounts/{$id}", ['_method' => 'PUT', 'accessories' => ''], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('accessories', null);
    }

    public function test_selling_keeps_listed_date_so_days_to_sell_can_be_measured(): void
    {
        $this->travelTo(now()->subDays(3));
        $id = $this->postJson('/api/v1/rucoy/accounts', ['description' => 'Lv 618 Melee', 'email' => 'acc@example.com', ...$this->stats()])->json('id');
        $this->travelBack();

        $this->postJson("/api/v1/rucoy/accounts/{$id}/archive")->assertOk();

        $account = RucoyAccount::findOrFail($id);
        $this->assertSame(3, (int) round($account->listed_at->diffInDays($account->archived_at)));
    }
}
