<?php

namespace Tests\Feature;

use App\Models\AccountPayment;
use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\Category;
use App\Models\Gold;
use App\Models\Operation;
use App\Models\RecurringEntry;
use App\Models\RucoyAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Master File → Undo. The core check: do something real through the API, undo it, and every
 * table must be exactly as before (only updated_at may differ: undoing is itself a change).
 * Redo must then bring back exactly the state after the action.
 */
class UndoTest extends TestCase
{
    use RefreshDatabase;

    /** Not compared: logs, the journal itself, logins, framework tables. */
    private const IGNORED = ['activity_logs', 'operations', 'operation_changes', 'personal_access_tokens', 'users', 'password_reset_tokens',
        'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 'migrations'];

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create();
        Sanctum::actingAs($this->admin);
        BalanceAccount::create(['code' => 'GCASH', 'name' => 'GCash', 'currency' => 'PHP', 'color' => 'blue', 'icon' => 'smartphone']);
    }

    /** Every row of every business table, without updated_at. */
    private function snapshot(): array
    {
        $tables = collect(DB::select('SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'))
            ->pluck('t')->reject(fn ($t) => in_array($t, self::IGNORED, true))->sort()->values();

        return $tables->mapWithKeys(fn ($t) => [$t => DB::table($t)->orderBy('id')->get()
            ->map(function ($r) {
                $r = (array) $r;
                unset($r['updated_at']);

                return $r;
            })->all()])->all();
    }

    private function latest(): Operation
    {
        return Operation::where('kind', 'action')->latest('id')->firstOrFail();
    }

    private function undo(Operation $op): TestResponse
    {
        return $this->postJson("/api/v1/master/operations/{$op->id}/undo");
    }

    /** Do it, undo it (all back), redo it (all as after). */
    private function assertUndoable(callable $action, ?string $label = null): Operation
    {
        $before = $this->snapshot();
        $action();
        $after = $this->snapshot();
        $this->assertNotEquals($before, $after, 'The action changed nothing');

        $op = $this->latest();
        if ($label !== null) {
            $this->assertSame($label, $op->label);
        }
        $this->undo($op)->assertOk();
        $this->assertEquals($before, $this->snapshot(), 'Undo did not restore everything');
        $this->assertNotNull($op->fresh()->undone_at);

        $this->postJson("/api/v1/master/operations/{$op->id}/redo")->assertOk();
        $this->assertEquals($after, $this->snapshot(), 'Redo did not bring the action back');
        $this->assertNull($op->fresh()->undone_at);

        return $op;
    }

    private function stash(): float
    {
        return (float) Gold::sum('amount');
    }

    public function test_selling_an_account_can_be_undone_with_its_sale_and_stash(): void
    {
        $id = $this->postJson('/api/v1/rucoy/accounts', ['email' => 'a@b.c', 'description' => 'Acc1', 'price' => 2000, 'cost' => 1500, 'payment_status' => 'not_paid'])
            ->assertCreated()->json('id');
        BusinessTransaction::create(['type' => 'account', 'account_id' => $id, 'amount' => 1, 'date' => '2026-10-01']);

        $this->assertUndoable(fn () => $this->postJson("/api/v1/rucoy/accounts/{$id}/archive")->assertOk(), 'Sold account “Acc1”');

        // After the redo it's sold again; undo once more and check what people see
        $this->undo($this->latest())->assertOk();
        $this->assertNull(RucoyAccount::find($id)->archived_at);
        $this->assertEquals(0, $this->stash());
    }

    public function test_to_gold_can_be_undone(): void
    {
        $account = RucoyAccount::create(['description' => '9/100 Gcash', 'email' => 'a@x.com', 'price' => 450_000_000, 'cost' => 400_000_000]);
        $tx = BusinessTransaction::create(['type' => 'account', 'account_id' => $account->id, 'amount' => 1, 'date' => '2026-11-04']);

        $this->assertUndoable(fn () => $this->putJson("/api/v1/business/transactions/{$tx->id}", [
            'type' => 'gold', 'account_id' => null, 'amount' => 1, 'date' => '2026-11-04', 'description' => '9/100 Gcash',
            'notes' => 'Converted from account: a@x.com', 'price_gold' => 450_000_000, 'cost_gold' => 400_000_000,
        ])->assertOk());
    }

    public function test_deleting_a_trade_brings_back_its_middleman_fee_too(): void
    {
        $id = $this->postJson('/api/v1/rucoy/trades', ['status' => 'kks', 'amount' => 5000, 'middleman_fee' => 100, 'description' => 'T1'])->assertCreated()->json('id');

        $this->assertUndoable(fn () => $this->deleteJson("/api/v1/rucoy/trades/{$id}")->assertOk(), 'Deleted trade “T1”');
    }

    public function test_adding_a_trade_with_a_fee_can_be_undone(): void
    {
        $this->assertUndoable(fn () => $this->postJson('/api/v1/rucoy/trades', ['status' => 'kks', 'amount' => 5000, 'middleman_fee' => 2_500_000, 'description' => 'T2'])->assertCreated());
    }

    public function test_transfers_can_be_undone_both_ways(): void
    {
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'add', 'amount' => 10_000, 'date' => '2026-11-01']);
        BalanceAccount::create(['code' => 'MAYA2', 'name' => 'Maya 2', 'currency' => 'PHP', 'color' => 'violet', 'icon' => 'wallet']);
        $make = fn () => $this->postJson('/api/v1/master/balance-transfers', ['from_account' => 'GCASH', 'to_account' => 'MAYA2', 'amount' => 3000, 'fee' => 15, 'date' => '2026-11-04'])->assertCreated();

        $this->assertUndoable($make);
        $id = DB::table('balance_transfers')->value('id');
        // Deleting it removes its entries (database cascade): undo brings them all back
        $this->assertUndoable(fn () => $this->deleteJson("/api/v1/master/balance-transfers/{$id}")->assertOk());
    }

    public function test_an_expense_paid_from_a_wallet_can_be_undone(): void
    {
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'add', 'amount' => 1000, 'date' => '2026-11-01']);
        $food = Category::create(['user_id' => $this->admin->id, 'name' => 'Food', 'type' => 'expense']);

        $this->assertUndoable(fn () => $this->postJson('/api/v1/transactions', [
            'category_id' => $food->id, 'type' => 'expense', 'amount' => 250, 'description' => 'Lunch', 'date' => '2026-11-05', 'balance_account' => 'GCASH',
        ])->assertCreated(), 'Added expense “Lunch”');
    }

    public function test_deleting_an_account_brings_back_its_payments_and_sale_link(): void
    {
        $account = RucoyAccount::create(['description' => 'Leblanc 651 Dist', 'email' => 'c@x.com', 'price' => 3_000_000_000, 'cost' => 1_000_000_000]);
        AccountPayment::create(['account_id' => $account->id, 'method' => 'cash', 'gold' => 540_000_000, 'cost_php' => 5820.12, 'date' => '2026-11-01']);
        BusinessTransaction::create(['type' => 'account', 'account_id' => $account->id, 'amount' => 1, 'date' => '2026-11-04']);

        $this->assertUndoable(fn () => $this->deleteJson("/api/v1/rucoy/accounts/{$account->id}")->assertOk());
        // Redone: deleted again, so the sale lost its link (the database unlinks it). Undo once more:
        $this->assertNull(BusinessTransaction::first()->account_id);
        $this->undo($this->latest())->assertOk();
        $this->assertSame($account->id, BusinessTransaction::first()->account_id);
        $this->assertSame(1, AccountPayment::where('account_id', $account->id)->count());
    }

    public function test_gold_trades_sales_top_ups_and_account_payments_can_be_undone(): void
    {
        // The same priced gold trade the Business tests use
        $trade = fn () => $this->postJson('/api/v1/business/transactions', [
            'type' => 'gold', 'description' => 'G1', 'date' => '2026-10-01', 'price_gold' => 1_200_000, 'cost_gold' => 700_000,
            'price_rate' => 0.2, 'cost_rate' => 0.2, 'php_rate' => 60, 'price_php' => 14.4, 'cost_php' => 8.4, 'amount' => 6, 'add_to_inventory' => true,
        ])->assertCreated();
        $this->assertUndoable($trade);
        $tx = BusinessTransaction::firstOrFail();

        $this->assertUndoable(fn () => $this->postJson("/api/v1/business/transactions/{$tx->id}/sell", ['amount' => 200_000, 'description' => 'to Bob'])->assertOk(), 'Sold “G1”');
        $this->assertUndoable(fn () => $this->postJson("/api/v1/business/transactions/{$tx->id}/add-gold", ['price_gold' => 100_000, 'cost_gold' => 50_000, 'description' => 'top up'])->assertOk());

        $account = $this->postJson('/api/v1/rucoy/accounts', ['description' => 'Lv 721 Distance', 'email' => 'acc@example.com', 'cost' => 300_000])->assertCreated()->json('id');
        $this->postJson('/api/v1/business/transactions', ['type' => 'account', 'account_id' => $account, 'date' => '2026-11-02', 'amount' => 0.01, 'cost_rate' => 0.2, 'cost_php_rate' => 60, 'php_rate' => 60])->assertCreated();
        $this->assertUndoable(fn () => $this->postJson("/api/v1/rucoy/accounts/{$account}/payments", [
            'method' => 'gold_trade', 'source_trade_id' => $tx->id, 'gold' => 300_000, 'date' => '2026-11-03',
        ])->assertCreated(), 'Added a payment to “Lv 721 Distance”');
    }

    public function test_the_gold_stash_wallets_and_settings_can_be_undone(): void
    {
        $this->postJson('/api/v1/rucoy/golds', ['amount' => 1000, 'description' => 'big'])->assertCreated();
        $this->assertUndoable(fn () => $this->postJson('/api/v1/rucoy/golds/sell', ['amount' => 300, 'description' => 'sold'])->assertOk(), 'Sold gold from the stash');
        $this->assertUndoable(fn () => $this->postJson('/api/v1/rucoy/golds/adjust', ['actual' => 500])->assertOk(), 'Corrected the gold stash');

        $gcash = BalanceAccount::where('code', 'GCASH')->firstOrFail();
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'add', 'amount' => 1000, 'date' => '2026-11-01']);
        $this->assertUndoable(fn () => $this->postJson("/api/v1/master/balance-accounts/{$gcash->id}/check", ['actual' => 1021.92])->assertOk(), 'Bank check: “GCash”');
        $this->assertUndoable(fn () => $this->putJson("/api/v1/master/balance-accounts/{$gcash->id}", ['name' => 'GCash main', 'interest_rate' => 3])->assertOk());
        $paypal = BalanceAccount::where('code', 'PAYPAL')->firstOrFail();
        $this->assertUndoable(fn () => $this->postJson('/api/v1/master/balance-accounts/reorder', ['ids' => [$gcash->id, $paypal->id]])->assertOk(), 'Reordered wallets');

        $this->assertUndoable(fn () => $this->putJson('/api/v1/business/website-gold', [
            'rates' => [['method' => 'Binance', 'currency' => 'USD', 'per_kk' => 0.195]], 'min_order_kk' => 100, 'note' => null,
        ])->assertOk(), 'Changed the website gold rates');
    }

    public function test_deletes_bring_back_what_the_database_removed_with_them(): void
    {
        BalanceEntry::create(['account' => 'GCASH', 'type' => 'add', 'amount' => 1000, 'date' => '2026-11-01']);
        $food = Category::create(['user_id' => $this->admin->id, 'name' => 'Food', 'type' => 'expense']);
        $lunch = $this->postJson('/api/v1/transactions', ['category_id' => $food->id, 'type' => 'expense', 'amount' => 250, 'description' => 'Lunch', 'date' => '2026-11-05', 'balance_account' => 'GCASH'])
            ->assertCreated()->json('id');

        // An expense paid from a wallet: its wallet entry goes with it
        $this->assertUndoable(fn () => $this->deleteJson("/api/v1/transactions/{$lunch}")->assertOk(), 'Deleted expense “Lunch”');

        // A category (only allowed once it has no entries): its budgets go with it (cascade)
        $fun = Category::create(['user_id' => $this->admin->id, 'name' => 'Fun', 'type' => 'expense']);
        $this->postJson('/api/v1/budgets', ['category_id' => $fun->id, 'amount' => 5000, 'month' => 11, 'year' => 2026])->assertCreated();
        $this->assertUndoable(fn () => $this->deleteJson("/api/v1/categories/{$fun->id}")->assertOk(), 'Deleted category “Fun”');
    }

    public function test_a_newer_change_to_the_same_field_must_be_undone_first(): void
    {
        $id = $this->postJson('/api/v1/rucoy/trades', ['status' => 'kks', 'amount' => 5000, 'description' => 'T1'])->assertCreated()->json('id');
        $this->putJson("/api/v1/rucoy/trades/{$id}", ['description' => 'Renamed'])->assertOk();
        $first = $this->latest();
        $this->putJson("/api/v1/rucoy/trades/{$id}", ['description' => 'Renamed again'])->assertOk();
        $second = $this->latest();

        $this->undo($first)->assertStatus(409)
            ->assertJsonPath('message', fn ($m) => str_contains($m, '“' . $second->label . '”') && str_contains($m, 'Undo that first'));
        $this->assertSame('Renamed again', DB::table('trades')->where('id', $id)->value('description')); // untouched

        $this->undo($second)->assertOk();
        $this->undo($first)->assertOk();
        $this->assertSame('T1', DB::table('trades')->where('id', $id)->value('description'));
    }

    public function test_a_newer_change_to_other_fields_is_kept(): void
    {
        $id = $this->postJson('/api/v1/rucoy/trades', ['status' => 'kks', 'amount' => 5000, 'description' => 'T1'])->assertCreated()->json('id');
        $this->putJson("/api/v1/rucoy/trades/{$id}", ['amount' => 7000])->assertOk();
        $amountEdit = $this->latest();
        $this->putJson("/api/v1/rucoy/trades/{$id}", ['description' => 'Renamed'])->assertOk();

        $this->undo($amountEdit)->assertOk();
        $row = DB::table('trades')->where('id', $id)->first();
        $this->assertEquals(5000, $row->amount);
        $this->assertSame('Renamed', $row->description);
    }

    public function test_something_added_to_a_new_record_must_be_undone_first(): void
    {
        $id = $this->postJson('/api/v1/rucoy/accounts', ['email' => 'a@b.c', 'description' => 'Acc1', 'price' => 2000, 'cost' => 1500])->assertCreated()->json('id');
        $created = $this->latest();
        AccountPayment::create(['account_id' => $id, 'method' => 'cash', 'gold' => 100, 'cost_php' => 10, 'date' => '2026-11-01']); // outside the app's history

        $this->undo($created)->assertStatus(409)->assertJsonPath('message', fn ($m) => str_contains($m, 'account payment'));
        $this->assertNotNull(RucoyAccount::find($id));
    }

    public function test_failed_requests_and_reads_are_not_recorded(): void
    {
        $this->postJson('/api/v1/rucoy/trades', ['status' => 'nope'])->assertStatus(422);
        $this->getJson('/api/v1/rucoy/trades')->assertOk();

        $this->assertSame(0, Operation::count());
    }

    public function test_the_history_lists_actions_with_their_changes(): void
    {
        $id = $this->postJson('/api/v1/rucoy/trades', ['status' => 'kks', 'amount' => 5000, 'middleman_fee' => 100, 'description' => 'T1'])->assertCreated()->json('id');
        $this->deleteJson("/api/v1/rucoy/trades/{$id}")->assertOk();
        $this->undo($this->latest())->assertOk();

        $list = $this->getJson('/api/v1/master/operations')->assertOk()
            ->assertJsonPath('total', 2) // undo entries aren't listed on their own
            ->assertJsonPath('data.0.label', 'Deleted trade “T1”')
            ->assertJsonPath('data.0.undone_by', $this->admin->name)
            ->json('data');
        $this->assertContains('middleman fee', collect($list[0]['changes'])->pluck('noun')->all());
        $this->assertSame('Added trade “T1”', $list[1]['label']);
    }

    public function test_undo_is_admin_only_and_cannot_run_twice(): void
    {
        $this->postJson('/api/v1/rucoy/trades', ['status' => 'kks', 'amount' => 5000, 'description' => 'T1'])->assertCreated();
        $op = $this->latest();
        $this->undo($op)->assertOk();
        $this->undo($op)->assertStatus(409);

        Sanctum::actingAs(User::factory()->create(['role' => 'daily_only']));
        $this->getJson('/api/v1/master/operations')->assertForbidden();
        $this->undo($op)->assertForbidden();
    }

    public function test_scheduled_jobs_are_undoable_too(): void
    {
        $bills = Category::create(['user_id' => $this->admin->id, 'name' => 'Bills', 'type' => 'expense']);
        RecurringEntry::create(['user_id' => $this->admin->id, 'category_id' => $bills->id, 'type' => 'expense', 'amount' => 999,
            'description' => 'Internet', 'frequency' => 'monthly', 'day_of_month' => 1, 'next_date' => now('Asia/Manila')->format('Y-m-d'), 'active' => true]);
        $before = $this->snapshot();

        $this->artisan('recurring:post')->assertSuccessful();
        $op = $this->latest();
        $this->assertSame(['Posted recurring entries', null], [$op->label, $op->user_id]);
        $this->undo($op)->assertOk();
        $this->assertEquals($before, $this->snapshot());

        // The undo put the entry's next date back, so the next run posts it again (one new operation);
        // a run that changes nothing (no interest rates set) records nothing
        $count = Operation::count();
        $this->artisan('recurring:post')->assertSuccessful();
        $this->artisan('balance:interest')->assertSuccessful();
        $this->assertSame($count + 1, Operation::count());
    }
}
