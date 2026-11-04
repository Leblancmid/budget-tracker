<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recurring\StoreRecurringEntryRequest;
use App\Http\Requests\Recurring\UpdateRecurringEntryRequest;
use App\Models\RecurringEntry;
use App\Services\RecurringEntries;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RecurringEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entries = RecurringEntry::with('category')
            ->where('user_id', auth()->id())
            ->orderByDesc('active')->orderBy('next_date')->orderBy('id')
            ->paginate(min($request->integer('per_page', 50), 100));

        return response()->json($entries);
    }

    public function store(StoreRecurringEntryRequest $request): JsonResponse
    {
        $data  = $request->validated();
        $entry = RecurringEntry::create([
            ...$data,
            'user_id'      => auth()->id(),
            'day_of_month' => $this->dayOfMonth($data['frequency'], $data['next_date']),
        ]);
        $this->postIfDue($entry->refresh());

        return response()->json($entry->fresh()->load('category'), 201);
    }

    public function update(UpdateRecurringEntryRequest $request, RecurringEntry $recurringEntry): JsonResponse
    {
        $recurringEntry->fill($request->validated());
        // A new date or frequency sets which day of the month it repeats on
        if ($recurringEntry->isDirty(['next_date', 'frequency'])) {
            $recurringEntry->day_of_month = $this->dayOfMonth($recurringEntry->frequency, $recurringEntry->next_date->format('Y-m-d'));
        }
        $recurringEntry->save();
        $this->postIfDue($recurringEntry);

        return response()->json($recurringEntry->fresh()->load('category'));
    }

    public function destroy(RecurringEntry $recurringEntry): JsonResponse
    {
        Gate::authorize('delete', $recurringEntry);
        // Transactions already posted stay (they really happened); they just lose the link
        $recurringEntry->delete();

        return response()->json(['message' => 'Recurring entry deleted.']);
    }

    private function dayOfMonth(string $frequency, string $date): ?int
    {
        return $frequency === 'monthly' ? (int) substr($date, 8, 2) : null;
    }

    /** Due today or earlier: post it right away instead of waiting for the scheduler. */
    private function postIfDue(RecurringEntry $entry): void
    {
        $today = CarbonImmutable::now(RecurringEntries::ZONE)->startOfDay();
        if ($entry->active && $entry->next_date->format('Y-m-d') <= $today->format('Y-m-d')) {
            RecurringEntries::post($entry->load('category'), $today);
        }
    }
}
