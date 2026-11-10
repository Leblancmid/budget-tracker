<?php

namespace Tests\Feature;

use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\Category;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Daily entries added offline on the phone and sent when the connection is back. */
class OfflineEntryTest extends TestCase
{
    use RefreshDatabase;

    private const ID = '0b6f4f5e-2c1a-4d8e-9a3b-5c7d9e1f2a4b';

    private User $user;

    private Category $food;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Sanctum::actingAs($this->user);
        $this->food = Category::create(['user_id' => $this->user->id, 'name' => 'Food', 'type' => 'expense']);
    }

    private function send(array $extra = []): TestResponse
    {
        return $this->postJson('/api/v1/transactions', [
            'category_id' => $this->food->id, 'type' => 'expense', 'amount' => 250, 'description' => 'Lunch',
            'date' => '2026-11-10', 'client_id' => self::ID, ...$extra,
        ]);
    }

    public function test_an_offline_entry_is_saved_with_its_id(): void
    {
        $this->send()->assertCreated()->assertJsonPath('client_id', self::ID);

        $this->assertSame(1, Transaction::where('client_id', self::ID)->count());
    }

    public function test_sending_the_same_entry_again_does_not_save_it_twice(): void
    {
        $first = $this->send()->assertCreated()->json('id');

        // The phone never got the first answer and sends it again
        $this->send()->assertOk()->assertJsonPath('id', $first);

        $this->assertSame(1, Transaction::count());
    }

    public function test_a_resent_entry_does_not_move_the_wallet_twice(): void
    {
        BalanceAccount::create(['code' => 'GCASH2', 'name' => 'GCash 2', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'wallet']);

        $this->send(['balance_account' => 'GCASH2'])->assertCreated();
        $this->send(['balance_account' => 'GCASH2'])->assertOk();

        $this->assertSame(1, BalanceEntry::where('account', 'GCASH2')->count());
    }

    public function test_entries_without_an_id_work_as_before(): void
    {
        $this->send(['client_id' => null])->assertCreated();
        $this->send(['client_id' => null])->assertCreated();

        $this->assertSame(2, Transaction::count());
    }

    public function test_the_id_must_be_a_uuid(): void
    {
        $this->send(['client_id' => 'abc'])->assertUnprocessable()->assertJsonValidationErrors('client_id');
    }

    public function test_an_entry_rejected_later_still_says_why(): void
    {
        // e.g. the category was deleted while the phone was offline
        $this->send(['category_id' => 999999])->assertUnprocessable()->assertJsonValidationErrors('category_id');

        $this->assertSame(0, Transaction::count());
    }
}
