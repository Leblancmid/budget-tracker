<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BalanceAccount;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\GoldLog;
use App\Models\Saving;
use App\Models\Trade;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class LogController extends Controller
{
    public function index(): JsonResponse
    {
        $allActivityLogs = ActivityLog::with('user:id,name,email')->get();

        // created events → keyed for IP/device merge into original table rows
        $activityMap = $allActivityLogs->whereIn('type', ['income', 'expense', 'gold', 'fee', 'add', 'sell', 'buy', 'kks', 'pending', 'completed', 'cancelled'])
            ->keyBy(fn ($l) => $l->loggable_type . '|' . $l->loggable_id);

        // archived and edited events → standalone log entries
        $standaloneEvents = $allActivityLogs->whereIn('type', ['archived', 'edited']);

        $logs = collect();

        Transaction::select('id', 'type', 'amount', 'description', 'date', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log = $activityMap->get(Transaction::class . '|' . $t->id);
                $logs->push($this->entry('daily', $t->type, $t->description, $t->amount, $t->date, $t->created_at, $log));
            });

        BusinessTransaction::select('id', 'type', 'description', 'amount', 'price_php', 'cost_php', 'profit_php', 'date', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log    = $activityMap->get(BusinessTransaction::class . '|' . $t->id);
                $amount = $t->profit_php ?? $t->price_php ?? $t->cost_php ?? $t->amount;
                $logs->push($this->entry('business', $t->type, $t->description, $amount, $t->date, $t->created_at, $log));
            });

        Saving::select('id', 'type', 'description', 'amount', 'date', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log = $activityMap->get(Saving::class . '|' . $t->id);
                $logs->push($this->entry('savings', $t->type, $t->description, $t->amount, $t->date, $t->created_at, $log));
            });

        // Balance amounts are in their account's currency (USD or PHP)
        $balanceAccounts = BalanceAccount::get(['code', 'name', 'currency'])->keyBy('code');
        BalanceEntry::select('id', 'account', 'type', 'description', 'amount', 'date', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(function ($t) use (&$logs, $activityMap, $balanceAccounts) {
                $log = $activityMap->get(BalanceEntry::class . '|' . $t->id);
                $logs->push([
                    ...$this->entry('balance', $t->type, $t->description, $t->amount, $t->date, $t->created_at, $log),
                    'currency'     => $balanceAccounts[$t->account]->currency ?? 'USD',
                    'account_name' => $balanceAccounts[$t->account]->name ?? $t->account,
                ]);
            });

        GoldLog::select('id', 'type', 'description', 'amount', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log = $activityMap->get(GoldLog::class . '|' . $t->id);
                $logs->push($this->entry('gold', $t->type, $t->description, $t->amount, null, $t->created_at, $log));
            });

        Trade::select('id', 'status', 'description', 'amount', 'currency', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
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
            ]);
        });

        return response()->json([
            'data' => $logs->sortByDesc('created_at')->values(),
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
