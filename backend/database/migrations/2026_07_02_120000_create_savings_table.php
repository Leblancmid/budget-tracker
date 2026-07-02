<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('savings', function (Blueprint $table) {
            $table->id();
            $table->enum('mode_of_payment', ['CIMB', 'MARIBANK', 'GCASH']);
            $table->enum('type', ['deposit', 'withdraw']);
            $table->enum('transfer', ['daily_expenses', 'business'])->nullable();
            $table->string('description', 255)->nullable();
            $table->decimal('amount', 15, 2);
            $table->date('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('savings');
    }
};
