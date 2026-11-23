<?php

namespace Tests\Feature;

use App\Models\BusinessTransaction;
use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Buyer reviews: a signed review link per sale, and approving the reviews for the website. */
class ReviewsTest extends TestCase
{
    use RefreshDatabase;

    private const TOKEN = 'tttttttttttttttttttttttttttttttttttttttt';

    /** The sale the fake website's one review is for */
    private int $reviewedSale = 0;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        config(['listing.site_url' => 'https://site.test', 'listing.site_token' => self::TOKEN]);
        Http::fake(fn (Request $r) => match (true) {
            str_contains($r->url(), '/api/reviews?all=1') => Http::response(['reviews' => [['id' => 7, 'sale_id' => $this->reviewedSale, 'item' => 'Lv 650 Melee', 'name' => 'Shiroe', 'rating' => 5, 'message' => 'Fast and safe', 'status' => 'pending', 'created_at' => 1]]]),
            str_contains($r->url(), '/api/reviews/') => Http::response(['ok' => true]),
            default => Http::response([], 404),
        });
    }

    private function sold(string $type, array $extra = []): BusinessTransaction
    {
        $sale = BusinessTransaction::create(['type' => $type, 'description' => 'Sale', 'amount' => 1, 'date' => '2026-11-20', ...$extra]);
        $sale->forceFill(['archived_at' => now()])->save();

        return $sale;
    }

    /** The payload a link carries, after checking its signature like the website does */
    private function read(string $url): array
    {
        [$payload, $sig] = explode('.', explode('?t=', $url)[1]);
        $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $payload, self::TOKEN, true)), '+/', '-_'), '=');
        $this->assertSame($expected, $sig, 'signed with the shared token');

        return json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
    }

    public function test_a_sold_account_gets_a_signed_review_link_that_never_shows_your_notes(): void
    {
        $account = RucoyAccount::create(['description' => 'Leblanc 650 Melee (bought from Kai, cheap)', 'email' => 'a@x.com']);
        $sale = $this->sold('account', ['account_id' => $account->id, 'description' => 'Leblanc 650 Melee (bought from Kai, cheap)']);

        $res = $this->postJson("/api/v1/business/transactions/{$sale->id}/review-link")->assertOk();
        $this->assertStringStartsWith('https://site.test/review?t=', $res->json('url'));
        $this->assertSame('Lv 650 Melee', $res->json('item'));

        $data = $this->read($res->json('url'));
        $this->assertSame([$sale->id, 'Lv 650 Melee'], [$data['s'], $data['l']]);
        $this->assertEqualsWithDelta(now()->addDays(60)->getTimestampMs(), $data['e'], 5000);
        $this->assertStringNotContainsString('Kai', $res->json('url'));
    }

    public function test_gold_gets_its_amount_and_unsold_or_other_sales_get_none(): void
    {
        $gold = $this->sold('gold', ['price_gold' => 500_000_000]);
        $this->assertSame('500KK gold', $this->postJson("/api/v1/business/transactions/{$gold->id}/review-link")->json('item'));

        $unsold = BusinessTransaction::create(['type' => 'account', 'description' => 'Lv 600 Dist', 'amount' => 1, 'date' => '2026-11-20']);
        $this->postJson("/api/v1/business/transactions/{$unsold->id}/review-link")->assertStatus(422);
        $expense = $this->sold('expense');
        $this->postJson("/api/v1/business/transactions/{$expense->id}/review-link")->assertStatus(422);

        config(['listing.site_token' => null]);
        $this->postJson("/api/v1/business/transactions/{$gold->id}/review-link")->assertStatus(422)
            ->assertJsonPath('message', fn ($m) => str_contains($m, 'LISTING_SITE_TOKEN'));
    }

    public function test_reviews_come_from_the_website_and_can_be_approved(): void
    {
        $reviewed = $this->sold('gold', ['price_gold' => 100_000_000, 'sold_to' => 'Shiroe']);
        $other = $this->sold('gold', ['price_gold' => 200_000_000, 'sold_to' => 'Mika']);
        $this->reviewedSale = $reviewed->id;
        $res = $this->getJson('/api/v1/business/reviews')->assertOk()->assertJsonPath('reviews.0.name', 'Shiroe');
        // Recent sales to ask, marked when that sale was reviewed
        $sales = collect($res->json('recent_sales'))->keyBy('id');
        $this->assertTrue($sales[$reviewed->id]['reviewed']);
        $this->assertFalse($sales[$other->id]['reviewed']);
        $this->assertSame('Mika', $sales[$other->id]['sold_to']);

        $this->patchJson('/api/v1/business/reviews/7', ['status' => 'approved'])->assertOk();
        Http::assertSent(fn (Request $r) => $r->method() === 'PATCH' && str_ends_with($r->url(), '/api/reviews/7')
            && $r['status'] === 'approved' && $r->header('Authorization')[0] === 'Bearer ' . self::TOKEN);
        $this->assertDatabaseHas('activity_logs', ['description' => 'Review #7: approved']);

        $this->patchJson('/api/v1/business/reviews/7', ['status' => 'deleted'])->assertStatus(422);
    }

    public function test_only_storefront_users_handle_reviews(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $sale = $this->sold('gold');
        $this->getJson('/api/v1/business/reviews')->assertForbidden();
        $this->postJson("/api/v1/business/transactions/{$sale->id}/review-link")->assertForbidden();
    }
}
