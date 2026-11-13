<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountPayment;
use App\Models\ActivityLog;
use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\GoldLog;
use App\Models\Saving;
use App\Models\Trade;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use App\Http\Requests\LogIndexRequest;

class LogController extends Controller
{
    /** Newest rows read from each table, at most (a backstop on top of the period) */
    private const PER_TABLE = 1000;

    /**
     * "Added" logs of records listed from their own tables below (daily entries, sales, wallet
     * entries…): they only give those rows who did it and from where, so aren't entries of their own.
     */
    private const MERGED_INTO_ROWS = ['income', 'expense', 'gold', 'account', 'cash', 'fee', 'add', 'sell', 'buy', 'kks', 'pending', 'completed', 'cancelled', 'payment'];

    /** Logs that are entries of their own. */
    private const STANDALONE = [
        'archived', 'edited', 'removed', 'added',
        'signed_in', 'signed_out', 'signed_out_all', 'sign_in_failed', 'locked_out',
        'undone', 'redone', 'published',
    ];

    public function index(LogIndexRequest $request): JsonResponse
    {
        // Only the chosen period (90 days unless asked): the page stays quick however long the app is used
        $days = $request->days();
        $since = $days > 0 ? now()->subDays($days) : null;

        $allActivityLogs = ActivityLog::with('user:id,name,email')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))->get();

        // created events → keyed for IP/device merge into original table rows
        $activityMap = $allActivityLogs->whereIn('type', self::MERGED_INTO_ROWS)
            ->keyBy(fn ($l) => $l->loggable_type . '|' . $l->loggable_id);

        // Everything else is its own entry: edits, sales, removals, records added (categories, wallets…),
        // sign-ins, undo / redo, publishing
        $standaloneEvents = $allActivityLogs->whereIn('type', self::STANDALONE);

        $logs = collect();

        Transaction::select('id', 'type', 'amount', 'description', 'date', 'created_at')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))->orderBy('created_at', 'desc')->limit(self::PER_TABLE)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log = $activityMap->get(Transaction::class . '|' . $t->id);
                $logs->push($this->entry('daily', $t->type, $t->description, $t->amount, $t->date, $t->created_at, $log));
            });

        BusinessTransaction::select('id', 'type', 'description', 'amount', 'price_php', 'cost_php', 'profit_php', 'date', 'created_at')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))->orderBy('created_at', 'desc')->limit(self::PER_TABLE)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log    = $activityMap->get(BusinessTransaction::class . '|' . $t->id);
                $amount = $t->profit_php ?? $t->price_php ?? $t->cost_php ?? $t->amount;
                $logs->push($this->entry('business', $t->type, $t->description, $amount, $t->date, $t->created_at, $log));
            });

        // Payments toward an account's cost (gold from a trade, cash, already paid): a ₱ cost
        AccountPayment::with('account:id,description,email')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))->orderBy('created_at', 'desc')->limit(self::PER_TABLE)->get()
            ->each(function ($p) use (&$logs, $activityMap) {
                $log = $activityMap->get(AccountPayment::class . '|' . $p->id);
                $logs->push($this->entry('business', 'payment', $p->summary(), $p->cost_php !== null ? -$p->cost_php : null, $p->date?->format('Y-m-d'), $p->created_at, $log));
            });

        Saving::select('id', 'type', 'description', 'amount', 'date', 'created_at')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))->orderBy('created_at', 'desc')->limit(self::PER_TABLE)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log = $activityMap->get(Saving::class . '|' . $t->id);
                $logs->push($this->entry('savings', $t->type, $t->description, $t->amount, $t->date, $t->created_at, $log));
            });

        // Balance amounts are in their account's currency (USD or PHP)
        $balanceAccounts = BalanceAccount::get(['code', 'name', 'currency'])->keyBy('code');
        BalanceEntry::select('id', 'account', 'type', 'description', 'amount', 'date', 'created_at')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))->orderBy('created_at', 'desc')->limit(self::PER_TABLE)->get()
            ->each(function ($t) use (&$logs, $activityMap, $balanceAccounts) {
                $log = $activityMap->get(BalanceEntry::class . '|' . $t->id);
                $logs->push([
                    ...$this->entry('balance', $t->type, $t->description, $t->amount, $t->date, $t->created_at, $log),
                    'currency'     => $balanceAccounts[$t->account]->currency ?? 'USD',
                    'account_name' => $balanceAccounts[$t->account]->name ?? $t->account,
                ]);
            });

        GoldLog::select('id', 'type', 'description', 'amount', 'created_at')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))->orderBy('created_at', 'desc')->limit(self::PER_TABLE)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log = $activityMap->get(GoldLog::class . '|' . $t->id);
                $logs->push($this->entry('gold', $t->type, $t->description, $t->amount, null, $t->created_at, $log));
            });

        Trade::select('id', 'status', 'description', 'amount', 'currency', 'created_at')
            ->when($since, fn ($q) => $q->where('created_at', '>=', $since))->orderBy('created_at', 'desc')->limit(self::PER_TABLE)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log         = $activityMap->get(Trade::class . '|' . $t->id);
                $description = $t->description;
                if ($t->currency) {
                    $description = trim(($description ? $description . ' · ' : '') . $t->currency);
                }
                $logs->push($this->entry('trade', $t->status, $description, $t->amount, null, $t->created_at, $log));
            });

        // Append archived and edited events as standalone entries
        $editedBalance = BalanceEntry::whereIn('id', $standaloneEvents->where('loggable_type', BalanceEntry::class)->pluck('loggable_id'))
            ->pluck('account', 'id');
        $standaloneEvents->each(function ($log) use (&$logs, $editedBalance, $balanceAccounts) {
            $account = $log->loggable_type === BalanceEntry::class ? ($editedBalance[$log->loggable_id] ?? null) : null;
            $logs->push([
                ...($account ? ['currency' => $balanceAccounts[$account]->currency ?? 'USD', 'account_name' => $balanceAccounts[$account]->name ?? $account] : []),
                'module'      => $log->module,
                'type'        => $log->type,
                'description' => $log->description,
                'amount'      => $log->amount,
                'changes'     => $log->getAttribute('changes'),
                'date'        => null,
                'created_at'  => $log->created_at->toISOString(),
                'ip_address'  => $log->ip_address,
                'user_agent'  => $log->user_agent,
                'user_id'     => $log->user_id,
                'user_name'   => $log->user?->name,
                'user_email'  => $log->user?->email,
                // Whose account it's about when nobody did it (a failed sign-in with their email)
                'about_user_id' => $log->user_id === null && $log->loggable_type === User::class ? $log->loggable_id : null,
            ]);
        });

        // Admins see everyone's; anyone else with the Master File sees only what they did (and failed
        // sign-ins with their own email)
        $me = $request->user();
        if (! $me->isAdmin()) {
            $logs = $logs->filter(fn (array $e) => ($e['user_id'] ?? null) === $me->id
                || (($e['about_user_id'] ?? null) === $me->id && in_array($e['type'], ['sign_in_failed', 'locked_out'], true)));
        }

        return response()->json([
            'data' => $logs->sortByDesc('created_at')->values(),
            'scope' => $me->isAdmin() ? 'everyone' : 'own',
            'days'  => $days,
        ]);
    }

    private function entry(string $module, string $type, ?string $description, $amount, ?string $date, $createdAt, ?ActivityLog $log): array
    {
        return [
            'module'      => $module,
            'type'        => $type,
            'description' => $description,
            'amount'      => $amount,
            'date'        => $date,
            'created_at'  => $createdAt instanceof Carbon ? $createdAt->toISOString() : $createdAt,
            'ip_address'  => $log?->ip_address,
            'user_agent'  => $log?->user_agent,
            'user_id'     => $log?->user_id,
            'user_name'   => $log?->user?->name,
            'user_email'  => $log?->user?->email,
        ];
    }
}
