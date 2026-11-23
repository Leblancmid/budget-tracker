<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Proven trades: your best trades shown on the website as proof (like the Discord references
 * channel), each with its value, date, a quote and screenshots.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('proof_trades', function (Blueprint $table) {
            $table->id();
            $table->string('title', 80);                 // "Top melee trade"
            $table->decimal('value', 14, 2);             // for ranking (biggest first) and the medals
            $table->string('currency', 3)->default('EUR');
            $table->date('traded_on')->nullable();
            $table->string('quote', 300)->nullable();    // "The goats, biggest trade in history"
            $table->string('quote_by', 40)->nullable();
            $table->boolean('published')->default(true);
            $table->timestamps();

            $table->index(['published', 'value']);
        });

        Schema::create('proof_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proof_trade_id')->constrained()->cascadeOnDelete();
            $table->string('path');                      // public disk, resized WebP
            $table->string('thumb_path');
            $table->unsignedSmallInteger('width');
            $table->unsignedSmallInteger('height');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['proof_trade_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('proof_images');
        Schema::dropIfExists('proof_trades');
    }
};
