<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * One-time switch from the old migrations (one file per change) to the squashed ones (one file per
 * table, 2026-11-10). A database that already ran every old migration has the final schema, so the
 * new files are just recorded as run and the old names are removed from the migrations table.
 * No table or row is touched. Runs before `migrate` in deploy\windows\after-deploy.ps1; does
 * nothing on a fresh database or once it has run.
 */
class MigrationsBaseline extends Command
{
    /** The migrations replaced by the squash, as recorded in the migrations table. */
    public const OLD = [
        '2024_01_01_000001_create_categories_table',
        '2024_01_01_000002_create_transactions_table',
        '2024_01_01_000003_create_budgets_table',
        '2024_01_02_000001_create_golds_table',
        '2024_01_02_000002_create_rucoy_accounts_table',
        '2024_01_02_000003_create_trades_table',
        '2026_07_01_093739_create_gold_logs_table',
        '2026_07_02_051125_create_business_transactions_table',
        '2026_07_02_120000_create_savings_table',
        '2026_07_06_100000_add_php_values_to_business_transactions_table',
        '2026_07_07_035531_create_personal_access_tokens_table',
        '2026_07_09_054146_add_payment_date_to_rucoy_accounts_table',
        '2026_07_22_000001_create_balance_entries_table',
        '2026_07_23_000001_create_middleman_fees_table',
        '2026_07_23_000002_add_fee_type_to_gold_logs_table',
        '2026_07_23_000003_add_cancelled_at_to_gold_logs_table',
        '2026_08_07_000001_create_activity_logs_table',
        '2026_08_14_000001_add_user_scope_to_daily_tables',
        '2026_08_19_000001_widen_rate_columns_on_business_transactions_table',
        '2026_08_19_000002_add_gold_amount_columns_to_business_transactions_table',
        '2026_08_24_000001_expand_balance_entries_account_enum',
        '2026_09_15_000001_add_cost_php_rate_to_business_transactions_table',
        '2026_09_18_091900_add_user_id_to_activity_logs_table',
        '2026_09_22_034500_add_middleman_fee_to_trades_table',
        '2026_10_06_084143_add_trade_id_to_middleman_fees_table',
        '2026_10_19_000001_add_gold_progress_to_business_transactions_table',
        '2026_10_19_000002_add_changes_to_activity_logs_table',
        '2026_10_19_000003_add_system_key_to_business_transactions_table',
        '2026_10_19_000004_create_balance_accounts_table',
        '2026_10_19_000005_add_scope_and_balance_link_to_transactions',
        '2026_10_20_000001_add_inventory_gold_to_business_transactions_table',
        '2026_10_21_000001_drop_legacy_business_category_tables',
        '2026_11_03_000001_add_listing_fields_to_rucoy_accounts_table',
        '2026_11_04_000001_add_accessories_to_rucoy_accounts_table',
        '2026_11_04_000002_create_account_payments_table',
        '2026_11_04_000003_add_deal_type_to_rucoy_accounts_table',
        '2026_11_04_000004_add_business_transaction_id_to_balance_entries',
        '2026_11_04_000005_add_undo_to_gold_logs',
        '2026_11_04_000006_add_transfers_and_interest_to_balance',
        '2026_11_05_000001_create_recurring_entries_and_balance_checks',
        '2026_11_05_000002_track_gold_trades_converted_from_accounts',
        '2026_11_09_000001_create_site_settings_table',
    ];

    /** The squashed migrations (database/migrations/2026_11_10_*). */
    public const NEW = [
        '2026_11_10_000001_create_categories_table',
        '2026_11_10_000002_create_recurring_entries_table',
        '2026_11_10_000003_create_transactions_table',
        '2026_11_10_000004_create_budgets_table',
        '2026_11_10_000005_create_golds_table',
        '2026_11_10_000006_create_rucoy_accounts_table',
        '2026_11_10_000007_create_trades_table',
        '2026_11_10_000008_create_gold_logs_table',
        '2026_11_10_000009_create_business_transactions_table',
        '2026_11_10_000010_create_savings_table',
        '2026_11_10_000011_create_personal_access_tokens_table',
        '2026_11_10_000012_create_balance_accounts_table',
        '2026_11_10_000013_create_balance_transfers_table',
        '2026_11_10_000014_create_balance_entries_table',
        '2026_11_10_000015_create_middleman_fees_table',
        '2026_11_10_000016_create_activity_logs_table',
        '2026_11_10_000017_create_account_payments_table',
        '2026_11_10_000018_create_site_settings_table',
    ];

    protected $signature = 'migrations:baseline';

    protected $description = 'Record the squashed migrations as run on a database that ran the old ones (one-time, safe to repeat)';

    public function handle(): int
    {
        if (! Schema::hasTable('migrations')) {
            $this->info('New database: nothing to baseline.');

            return self::SUCCESS;
        }

        $ran = DB::table('migrations')->whereIn('migration', self::OLD)->pluck('migration')->all();
        if ($ran === []) {
            $this->info('Nothing to baseline: this database already uses the squashed migrations.');

            return self::SUCCESS;
        }

        // Only a database that ran every old migration has the final schema the new files describe
        $missing = array_values(array_diff(self::OLD, $ran));
        if ($missing !== []) {
            $this->error('This database is missing ' . count($missing) . ' migration(s) from before the squash:');
            foreach ($missing as $name) {
                $this->line("  - {$name}");
            }
            $this->error('Deploy the version before the squash first (so they run), then deploy again.');

            return self::FAILURE;
        }

        $tables = array_map(fn ($name) => preg_replace('/^\d{4}_\d{2}_\d{2}_\d{6}_create_(.+)_table$/', '$1', $name), self::NEW);
        $absent = array_values(array_filter($tables, fn ($t) => ! Schema::hasTable($t)));
        if ($absent !== []) {
            $this->error('These tables should exist but don\'t: ' . implode(', ', $absent) . '. Nothing was changed.');

            return self::FAILURE;
        }

        DB::transaction(function () {
            // The oldest batch, so a later `migrate:rollback` never reaches these
            $batch = (int) DB::table('migrations')->min('batch') ?: 1;
            $recorded = DB::table('migrations')->whereIn('migration', self::NEW)->pluck('migration')->all();
            DB::table('migrations')->insert(array_map(
                fn ($name) => ['migration' => $name, 'batch' => $batch],
                array_values(array_diff(self::NEW, $recorded)),
            ));
            DB::table('migrations')->whereIn('migration', self::OLD)->delete();
        });

        $this->info('Baselined: ' . count(self::NEW) . ' squashed migrations recorded as run, ' . count(self::OLD) . ' old entries removed.');

        return self::SUCCESS;
    }
}
