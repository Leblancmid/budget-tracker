<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The undo journal. An operation is one thing done in the app (add an expense, sell an account,
 * a transfer…); its changes are every database row that thing created, changed or deleted, with
 * the row before and after, so it can be put back exactly (Master File → Undo).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // null: the scheduler
            $table->string('label', 160);
            $table->string('route', 100)->nullable();
            $table->string('kind', 10)->default('action'); // action | undo
            // For an undo: the operation it reversed
            $table->foreignId('reverts_id')->nullable()->constrained('operations')->nullOnDelete();
            // Set while this operation is undone (cleared again if the undo is itself undone)
            $table->foreignId('undone_by_id')->nullable()->constrained('operations')->nullOnDelete();
            $table->timestamp('undone_at')->nullable();
            $table->timestamps();
            $table->index('created_at');
        });

        Schema::create('operation_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('operation_id')->constrained()->cascadeOnDelete();
            $table->string('table_name', 64);
            $table->unsignedBigInteger('row_id');
            $table->string('action', 10); // created | updated | deleted
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->index(['table_name', 'row_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_changes');
        Schema::dropIfExists('operations');
    }
};
