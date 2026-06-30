<?php

use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index']);

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('transactions', TransactionController::class);

    Route::get('budgets', [BudgetController::class, 'index']);
    Route::post('budgets', [BudgetController::class, 'store']);
    Route::put('budgets/{budget}', [BudgetController::class, 'update']);
    Route::delete('budgets/{budget}', [BudgetController::class, 'destroy']);
});
