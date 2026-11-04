<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Transfers move money between two Balance accounts (e.g. Maribank → GCash): the money out,
     * an optional fee and the money in are entries linked to one transfer, removed together.
     * Accounts can earn interest: an optional yearly rate, minus withholding tax, credited daily.
     */
    public function up(): void
    {
        Schema::create('balance_transfers', function (Blueprint $table) {
            $table->id();
            $table->string('from_account', 50);
            $table->string('to_account', 50);
            $table->decimal('amount', 15, 2);   // sent, in the from account's currency
            $table->decimal('received', 15, 2); // arrived, in the to account's currency
            $table->decimal('fee', 15, 2)->nullable(); // charged on top, in the from account's currency
            $table->date('date');
            $table->string('note')->nullable();
            $table->timestamps();
            $table->index('date');
        });

        Schema::table('balance_entries', function (Blueprint $table) {
            $table->foreignId('balance_transfer_id')->nullable()->after('business_transaction_id')
                ->constrained('balance_transfers')->cascadeOnDelete();
            // 'interest' for daily interest credits; null for everything else
            $table->string('kind', 20)->nullable()->after('type');
        });

        Schema::table('balance_accounts', function (Blueprint $table) {
            $table->decimal('interest_rate', 7, 4)->nullable()->after('icon'); // % per year
            $table->decimal('interest_tax', 5, 2)->default(20)->after('interest_rate'); // % withheld
            $table->date('interest_credited_through')->nullable()->after('interest_tax');
        });
    }

    public function down(): void
    {
        Schema::table('balance_accounts', function (Blueprint $table) {
            $table->dropColumn(['interest_rate', 'interest_tax', 'interest_credited_through']);
        });
        Schema::table('balance_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('balance_transfer_id');
            $table->dropColumn('kind');
        });
        Schema::dropIfExists('balance_transfers');
    }
};
