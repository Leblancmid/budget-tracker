<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-module access: which parts of the app a (non-admin) user can open, e.g. a trader who also
 * sees the wallets. Empty means "what their role gives" (see User::PRESETS), so existing users keep
 * exactly the access they have now.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->json('modules')->nullable()->after('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('modules');
        });
    }
};
