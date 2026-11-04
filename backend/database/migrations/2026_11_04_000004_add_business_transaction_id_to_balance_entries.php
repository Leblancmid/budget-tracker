<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Buying gold can be paid from a Balance wallet: the deduction is linked to the gold trade.
     * nullOnDelete: a trade removed because its gold was used up keeps the payment in Balance
     * (the money was really spent); deleting a pending trade by mistake refunds it in code.
     */
    public function up(): void
    {
        Schema::table('balance_entries', function (Blueprint $table) {
            $table->foreignId('business_transaction_id')->nullable()->after('transaction_id')
                ->constrained('business_transactions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('balance_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('business_transaction_id');
        });
    }
};
