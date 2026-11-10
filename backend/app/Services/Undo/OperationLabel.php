<?php

namespace App\Services\Undo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/** Plain names for operations ("Sold “Leblanc 700 Dist”") and for the rows they changed. */
class OperationLabel
{
    /** What each table's rows are called. */
    public const NOUNS = [
        'transactions'          => 'daily entry',
        'categories'            => 'category',
        'budgets'               => 'budget',
        'recurring_entries'     => 'recurring entry',
        'golds'                 => 'gold stash entry',
        'gold_logs'             => 'gold history entry',
        'rucoy_accounts'        => 'account',
        'trades'                => 'trade',
        'middleman_fees'        => 'middleman fee',
        'business_transactions' => 'sale',
        'account_payments'      => 'account payment',
        'balance_accounts'      => 'wallet',
        'balance_entries'       => 'wallet entry',
        'balance_transfers'     => 'transfer',
        'savings'               => 'savings entry',
        'site_settings'         => 'website setting',
    ];

    /** Route names with their own wording ({name} = the record's name). */
    private const SPECIAL = [
        'business.transactions.sell'          => 'Sold {name}',
        'business.transactions.add-gold'      => 'Added gold to {name}',
        // "Archived" means sold in this app
        'business.transactions.archive'       => 'Marked {name} as sold',
        'business.transactions.unarchive'     => 'Marked {name} as not sold',
        'rucoy.accounts.archive'              => 'Sold account {name}',
        'rucoy.accounts.unarchive'            => 'Marked account {name} as not sold',
        'rucoy.accounts.payments.store'       => 'Added a payment to {name}',
        'rucoy.accounts.payments.destroy'     => 'Removed a payment from {name}',
        'rucoy.trades.archive'                => 'Completed trade {name}',
        'rucoy.trades.unarchive'              => 'Reopened trade {name}',
        'rucoy.golds.sell'                    => 'Sold gold from the stash',
        'rucoy.golds.adjust'                  => 'Corrected the gold stash',
        'rucoy.gold-logs.cancel'              => 'Cancelled gold entry {name}',
        'master.balance-accounts.reorder'     => 'Reordered wallets',
        'master.balance-accounts.check'       => 'Bank check: {name}',
        'business.website-gold.update'        => 'Changed the website gold rates',
        'business.listing.publish'            => 'Published listings to the website',
    ];

    private const VERBS = ['store' => 'Added', 'update' => 'Edited', 'destroy' => 'Deleted'];

    private const ROUTE_NOUNS = [
        'transactions' => 'daily entry', 'categories' => 'category', 'budgets' => 'budget', 'recurring-entries' => 'recurring entry',
        'business.transactions' => 'sale', 'master.balance-accounts' => 'wallet', 'master.balance-entries' => 'wallet entry',
        'master.balance-transfers' => 'transfer', 'rucoy.accounts' => 'account', 'rucoy.golds' => 'gold stash entry',
        'rucoy.middleman-fees' => 'middleman fee', 'rucoy.trades' => 'trade',
    ];

    /**
     * The label for a request that changed data.
     *
     * @param  list<array{table_name: string, action: string, before: ?array, after: ?array}>  $changes
     */
    public static function forRequest(Request $request, array $changes): string
    {
        $route = (string) $request->route()?->getName();
        $name = self::boundName($request) ?? self::firstName($changes);
        $quoted = $name !== null ? '“' . $name . '”' : '';

        if (isset(self::SPECIAL[$route])) {
            return trim(str_replace('{name}', $quoted, self::SPECIAL[$route]));
        }
        $verb = self::VERBS[substr($route, strrpos($route, '.') + 1)] ?? 'Changed';
        $resource = substr($route, 0, (int) strrpos($route, '.'));
        $noun = self::ROUTE_NOUNS[$resource] ?? 'data';
        if ($resource === 'transactions') {
            // Daily entries: say which kind
            $type = $request->route('transaction')?->type ?? collect($changes)->firstWhere('table_name', 'transactions')['after']['type'] ?? null;
            $noun = $type === 'income' ? 'income' : ($type === 'expense' ? 'expense' : $noun);
        }

        return trim("{$verb} {$noun} {$quoted}");
    }

    /** "Leblanc 700 Dist", "PayPal → GCash", "Lunch": what a row is, for people. */
    public static function nameOf(?array $row): ?string
    {
        if (! $row) {
            return null;
        }
        $name = $row['description'] ?? $row['name'] ?? $row['email'] ?? $row['code'] ?? null;
        if ($name === null && isset($row['from_account'], $row['to_account'])) {
            $name = $row['from_account'] . ' → ' . $row['to_account'];
        }
        $name = $name !== null ? trim((string) $name) : '';

        return $name === '' ? null : mb_strimwidth($name, 0, 60, '…');
    }

    private static function boundName(Request $request): ?string
    {
        foreach ($request->route()?->parameters() ?? [] as $param) {
            if ($param instanceof Model) {
                // The account a payment belongs to reads better than the payment
                return self::nameOf($param->getAttributes());
            }
        }

        return null;
    }

    private static function firstName(array $changes): ?string
    {
        foreach ($changes as $c) {
            if ($c['action'] === 'created' && ($n = self::nameOf($c['after']))) {
                return $n;
            }
        }

        return null;
    }
}
