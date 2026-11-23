<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\IndexBuyersRequest;
use App\Models\RucoyAccount;
use App\Services\Buyers;
use App\Services\LikelyBuyers;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

/** The people you sell to (from "Sold to"), with how often and how much each one buys. */
class BuyerController extends Controller
{
    public function index(IndexBuyersRequest $request): JsonResponse
    {
        $all = Buyers::all();
        $q   = Buyers::key((string) $request->validated('q', ''));
        $list = $q === '' ? $all : $all->filter(fn ($b) => str_contains(Buyers::key($b['name']), $q));
        $list = match ($request->validated('sort') ?? 'recent') {
            'purchases' => $list->sortByDesc(fn ($b) => [$b['purchases'], $b['last_on']]),
            'total'     => $list->sortByDesc('total_php'),
            default     => $list, // already newest first
        };

        $perPage = (int) ($request->validated('per_page') ?? 15);
        $page    = (int) ($request->validated('page') ?? 1);
        $paged   = new LengthAwarePaginator($list->values()->forPage($page, $perPage)->values(), $list->count(), $perPage, $page);

        // Totals are for everyone, whatever the search
        return response()->json([...$paged->toArray(), 'summary' => Buyers::summary($all)]);
    }

    /**
     * For each account for sale: past buyers of a similar one (same build, close level), to message
     * first. Keyed by account id; an account with none has an empty list.
     */
    public function likely(): JsonResponse
    {
        return response()->json(['accounts' => (object) LikelyBuyers::forAccounts(RucoyAccount::active()->get())]);
    }
}
