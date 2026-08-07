<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BalanceEntry;
use App\Models\BusinessTransaction;
use App\Models\GoldLog;
use App\Models\Saving;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;

class LogController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = collect();

        Transaction::select('type', 'amount', 'description', 'date', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(fn($t) => $logs->push([
                'module'      => 'daily',
                'type'        => $t->type,
                'description' => $t->description,
                'amount'      => $t->amount,
                'date'        => $t->date,
                'created_at'  => $t->created_at->toISOString(),
            ]));

        BusinessTransaction::select('type', 'description', 'amount', 'price_php', 'cost_php', 'profit_php', 'date', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(fn($t) => $logs->push([
                'module'      => 'business',
                'type'        => $t->type,
                'description' => $t->description,
                'amount'      => $t->profit_php ?? $t->price_php ?? $t->cost_php ?? $t->amount,
                'date'        => $t->date,
                'created_at'  => $t->created_at->toISOString(),
            ]));

        Saving::select('type', 'description', 'amount', 'date', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(fn($t) => $logs->push([
                'module'      => 'savings',
                'type'        => $t->type,
                'description' => $t->description,
                'amount'      => $t->amount,
                'date'        => $t->date,
                'created_at'  => $t->created_at->toISOString(),
            ]));

        BalanceEntry::select('type', 'description', 'amount', 'date', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(fn($t) => $logs->push([
                'module'      => 'balance',
                'type'        => $t->type,
                'description' => $t->description,
                'amount'      => $t->amount,
                'date'        => $t->date,
                'created_at'  => $t->created_at->toISOString(),
            ]));

        GoldLog::select('type', 'description', 'amount', 'created_at')
            ->orderBy('created_at', 'desc')->limit(500)->get()
            ->each(fn($t) => $logs->push([
                'module'      => 'gold',
                'type'        => $t->type,
                'description' => $t->description,
                'amount'      => $t->amount,
                'date'        => null,
                'created_at'  => $t->created_at->toISOString(),
            ]));

        return response()->json([
            'data' => $logs->sortByDesc('created_at')->values(),
        ]);
    }
}
