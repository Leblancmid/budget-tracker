<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rucoy_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->string('email');
            $table->string('avatar')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('cost', 12, 2)->nullable();
            $table->enum('payment_status', ['not_paid', 'partially_paid', 'fully_paid'])->default('not_paid');
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rucoy_accounts');
    }
};
