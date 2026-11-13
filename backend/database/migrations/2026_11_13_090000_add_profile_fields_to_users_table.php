<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Profiles and user management: a profile picture, and turning an account off (instead of deleting
 * it, which would also delete that person's expenses and their part of the audit log).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar_path')->nullable()->after('email');
            $table->timestamp('deactivated_at')->nullable()->after('role')->index();
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['role']);
            $table->dropIndex(['deactivated_at']);
            $table->dropColumn(['avatar_path', 'deactivated_at']);
        });
    }
};
