<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Recurring daily transactions (bills, allowances), posted automatically by recurring:post.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recurring_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('type', 10);                 // income | expense
            $table->string('scope', 10)->default('personal');
            $table->decimal('amount', 12, 2);
            $table->string('description')->nullable();
            $table->string('balance_account', 50)->nullable();
            $table->string('frequency', 10);            // daily | weekly | monthly
            $table->unsignedTinyInteger('day_of_month')->nullable(); // monthly: 1–31, clamped to short months
            $table->date('next_date')->index();
            $table->boolean('active')->default(true)->index();
            $table->date('last_posted_on')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recurring_entries');
    }
};
