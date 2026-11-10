<?php

namespace Tests\Feature;

use App\Console\Commands\MigrationsBaseline;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/** The one-time switch from the old per-change migrations to the squashed per-table ones. */
class MigrationsBaselineTest extends TestCase
{
    use RefreshDatabase;

    private function recorded(): array
    {
        return DB::table('migrations')->pluck('batch', 'migration')->all();
    }

    /** Make the migrations table look like the server's before the squash. */
    private function asBeforeTheSquash(array $old = MigrationsBaseline::OLD): void
    {
        DB::table('migrations')->whereIn('migration', MigrationsBaseline::NEW)->delete();
        foreach ($old as $i => $name) {
            DB::table('migrations')->insert(['migration' => $name, 'batch' => 1 + intdiv($i, 10)]);
        }
    }

    public function test_every_squashed_file_is_listed(): void
    {
        $files = collect(glob(database_path('migrations/2026_11_10_0000*.php')))->map(fn ($f) => basename($f, '.php'))->all();
        $this->assertSame(MigrationsBaseline::NEW, $files);
    }

    public function test_a_new_database_is_left_alone(): void
    {
        $before = $this->recorded();

        $this->artisan('migrations:baseline')->expectsOutputToContain('already uses the squashed migrations')->assertSuccessful();

        $this->assertSame($before, $this->recorded());
    }

    public function test_a_database_that_ran_the_old_migrations_is_switched_over(): void
    {
        $this->asBeforeTheSquash();

        $this->artisan('migrations:baseline')->assertSuccessful();

        $after = $this->recorded();
        foreach (MigrationsBaseline::OLD as $name) {
            $this->assertArrayNotHasKey($name, $after);
        }
        foreach (MigrationsBaseline::NEW as $name) {
            $this->assertSame(1, $after[$name]); // the oldest batch: a rollback never reaches them
        }
        $this->artisan('migrate', ['--pretend' => true])->expectsOutputToContain('Nothing to migrate');

        // Running it again changes nothing
        $this->artisan('migrations:baseline')->assertSuccessful();
        $this->assertSame($after, $this->recorded());
    }

    public function test_a_database_missing_an_old_migration_is_not_touched(): void
    {
        $this->asBeforeTheSquash(array_slice(MigrationsBaseline::OLD, 0, -1));
        $before = $this->recorded();

        $this->artisan('migrations:baseline')
            ->expectsOutputToContain(MigrationsBaseline::OLD[count(MigrationsBaseline::OLD) - 1])
            ->assertFailed();

        $this->assertSame($before, $this->recorded());
    }
}
