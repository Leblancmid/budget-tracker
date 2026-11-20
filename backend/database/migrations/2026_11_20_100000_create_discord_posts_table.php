<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Each Listing Kit image sent to a Discord channel (auto-post, "Post image to Discord", publish):
 * did it go through. Channels are kept as a short fingerprint of the webhook, never the link.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discord_posts', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 10);                 // auto | manual | publish
            $table->date('slot_date');                  // Manila day
            $table->string('slot', 2);                  // am | pm (10 AM / 10 PM run)
            $table->string('channel_key', 16)->nullable(); // null: the whole run was skipped
            $table->unsignedTinyInteger('channel_no')->nullable();
            $table->boolean('ok')->default(false);
            $table->unsignedSmallInteger('status')->nullable(); // Discord's HTTP answer
            $table->string('note')->nullable();         // why it was skipped / failed
            $table->timestamp('created_at')->nullable();

            $table->index(['slot_date', 'slot']);
            $table->index('channel_key');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discord_posts');
    }
};
