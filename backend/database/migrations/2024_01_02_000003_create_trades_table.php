<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gold_id')->nullable()->constrained('golds')->nullOnDelete();
            $table->string('description')->nullable();
            $table->enum('status', ['kks', 'cash']);
            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->nullable();
            $table->string('payment_method')->nullable();
            $table->date('completion_date')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trades');
    }
};
