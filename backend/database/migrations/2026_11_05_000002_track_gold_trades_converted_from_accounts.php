<?php

use App\Models\BusinessTransaction;
use App\Models\GoldLog;
use App\Services\BusinessTransactionService;
use App\Services\GoldInventory;
use Illuminate\Database\Migrations\Migration;

/**
 * Accounts converted with "To Gold" before the fix never put their gold in the stash. Put the
 * gold of the ones still pending in now (once, logged as "Converted: …").
 */
return new class extends Migration
{
    public function up(): void
    {
        $service = app(BusinessTransactionService::class);
        $this->converted()->whereNull('inventory_gold')->get()
            ->each(fn (BusinessTransaction $tx) => $service->trackConverted($tx));
    }

    public function down(): void
    {
        $this->converted()->whereNotNull('inventory_gold')->get()->each(function (BusinessTransaction $tx) {
            $label = 'Converted: ' . ($tx->description ?: 'Gold trade');
            if (! GoldLog::where('description', $label)->exists()) {
                return; // tracked some other way: leave it
            }
            if ((float) $tx->inventory_gold != 0) {
                GoldInventory::record(-(float) $tx->inventory_gold, 'Removed: ' . ($tx->description ?: 'Gold trade'));
            }
            $tx->inventory_gold = null;
            $tx->saveQuietly();
        });
    }

    private function converted()
    {
        return BusinessTransaction::where('type', 'gold')->whereNull('archived_at')->whereNull('system_key')
            ->where('notes', 'like', '%Converted from account:%');
    }
};
