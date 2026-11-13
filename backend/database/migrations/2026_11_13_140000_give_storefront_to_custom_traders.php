<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Listing Kit and Leads moved out of Trading into their own module (storefront). Anyone whose
 * modules were picked by hand with Trading keeps what they could open: storefront is added for them.
 * (Everyone else follows their role, and the Trader role includes it.)
 */
return new class extends Migration
{
    public function up(): void
    {
        // Order doesn't matter: User::modules() always returns them in the app's order
        $this->each(fn (array $m) => in_array('trading', $m, true) && ! in_array('storefront', $m, true) ? [...$m, 'storefront'] : null);
    }

    public function down(): void
    {
        $this->each(fn (array $m) => in_array('storefront', $m, true) ? array_values(array_diff($m, ['storefront'])) : null);
    }

    /** Rewrite each stored module list that $change returns a new value for. */
    private function each(callable $change): void
    {
        DB::table('users')->whereNotNull('modules')->get(['id', 'modules'])->each(function ($u) use ($change) {
            $next = $change(json_decode($u->modules, true) ?? []);
            if ($next !== null) {
                DB::table('users')->where('id', $u->id)->update(['modules' => json_encode($next)]);
            }
        });
    }
};
