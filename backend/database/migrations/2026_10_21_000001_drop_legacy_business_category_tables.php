<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Business categories and budgets were replaced by the type field on business transactions;
 * nothing reads these tables any more. They only exist on databases created before that change.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('business_budgets');
        Schema::dropIfExists('business_categories');
    }

    public function down(): void
    {
        Schema::create('business_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['account', 'gold', 'expense']);
            $table->string('color', 7)->default('#6366f1');
            $table->string('icon')->default('tag');
            $table->timestamps();
        });

        Schema::create('business_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('business_categories')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->timestamps();
            $table->unique(['category_id', 'month', 'year']);
        });
    }
};
