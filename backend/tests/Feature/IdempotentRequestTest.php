<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Offline changes are sent with an Idempotency-Key, so a resend after a lost answer happens once. */
class IdempotentRequestTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = '7d3f1c2a-9b4e-4f6a-8c1d-2e3f4a5b6c7d';

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
    }

    private function add(string $name, ?string $key = self::KEY): TestResponse
    {
        return $this->withHeaders($key ? ['Idempotency-Key' => $key] : [])->postJson('/api/v1/categories', ['name' => $name, 'type' => 'expense']);
    }

    public function test_the_same_change_sent_twice_is_done_once_and_gets_the_same_answer(): void
    {
        $first = $this->add('Snacks')->assertCreated();
        $again = $this->add('Snacks')->assertCreated()->assertHeader('Idempotent-Replay', 'true');

        $this->assertSame($first->json('id'), $again->json('id'));
        $this->assertSame(1, Category::where('name', 'Snacks')->count());
    }

    public function test_a_refusal_is_remembered_too(): void
    {
        $this->add('')->assertUnprocessable();
        $this->add('')->assertUnprocessable()->assertHeader('Idempotent-Replay', 'true');
    }

    public function test_requests_without_a_key_work_as_before(): void
    {
        $this->add('Snacks', null)->assertCreated();
        $this->add('Snacks', null)->assertCreated();

        $this->assertSame(2, Category::where('name', 'Snacks')->count());
    }

    public function test_keys_belong_to_each_person(): void
    {
        $this->add('Mine')->assertCreated();

        Sanctum::actingAs(User::factory()->create());
        $this->add('Theirs')->assertCreated()->assertHeaderMissing('Idempotent-Replay');

        $this->assertSame(1, Category::where('name', 'Theirs')->count());
    }
}
