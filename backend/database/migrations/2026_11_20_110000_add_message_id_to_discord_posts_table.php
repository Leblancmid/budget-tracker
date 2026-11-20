<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Discord message each post made, so the next post to that channel can delete it (one listing
 * post per channel). Cleared once that message is deleted.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discord_posts', function (Blueprint $table) {
            $table->string('message_id', 25)->nullable()->after('status');
            $table->index(['channel_key', 'message_id']);
        });
    }

    public function down(): void
    {
        Schema::table('discord_posts', function (Blueprint $table) {
            $table->dropIndex(['channel_key', 'message_id']);
            $table->dropColumn('message_id');
        });
    }
};
