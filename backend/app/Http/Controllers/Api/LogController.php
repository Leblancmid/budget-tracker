<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\GoldLog;
use App\Models\Saving;
use App\Models\Trade;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;

class LogController extends Controller
{
    public function index(): JsonResponse
    {
        $allActivityLogs = ActivityLog::all();

        // created events → keyed for IP/device merge into original table rows
        $activityMap = $allActivityLogs->where('type', '!=', 'archived')
            ->keyBy(fn($l) => $l->loggable_type . '|' . $l->loggable_id);

        // archived events → standalone log entries
        $archivedEvents = $allActivityLogs->where('type', 'archived');

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

        BalanceEntry::select('id', 'type', 'description', 'amount', 'date', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(function ($t) use (&$logs, $activityMap) {
                $log = $activityMap->get(BalanceEntry::class . '|' . $t->id);
                $logs->push($this->entry('balance', $t->type, $t->description, $t->amount, $t->date, $t->created_at, $log));
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

        // Append archived events as standalone entries
        $archivedEvents->each(function ($log) use (&$logs) {
            $logs->push([
                'module'      => $log->module,
                'type'        => 'archived',
                'description' => $log->description,
                'amount'      => $log->amount,
                'date'        => null,
                'created_at'  => $log->created_at->toISOString(),
                'ip_address'  => $log->ip_address,
                'user_agent'  => $log->user_agent,
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
            'created_at'  => $createdAt instanceof \Carbon\Carbon ? $createdAt->toISOString() : $createdAt,
            'ip_address'  => $log?->ip_address,
            'user_agent'  => $log?->user_agent,
        ];
    }
}
