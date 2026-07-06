<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->nullable()->constrained('rucoy_accounts')->nullOnDelete();
            $table->enum('type', ['account', 'gold', 'expense']);
            $table->enum('action', ['buy', 'sell'])->nullable();
            $table->decimal('price_rate', 10, 6)->nullable();
            $table->decimal('cost_rate', 10, 6)->nullable();
            $table->decimal('php_rate', 10, 4)->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('description')->nullable();
            $table->date('date');
            $table->text('notes')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_transactions');
    }
};
