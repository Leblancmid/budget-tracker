<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Who bought a sale (a name or contact), optional. Private: never sent to the website. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            $table->string('sold_to', 100)->nullable()->after('notes')->index();
        });
    }

    public function down(): void
    {
        Schema::table('business_transactions', function (Blueprint $table) {
            $table->dropIndex(['sold_to']);
            $table->dropColumn('sold_to');
        });
    }
};
