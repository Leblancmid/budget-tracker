<?php

use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\Rucoy\GoldController;
use App\Http\Controllers\Api\Rucoy\RucoyAccountController;
use App\Http\Controllers\Api\Rucoy\RucoyDashboardController;
use App\Http\Controllers\Api\Rucoy\TradeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Budget Tracker
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('transactions', TransactionController::class);
    Route::get('budgets', [BudgetController::class, 'index']);
    Route::post('budgets', [BudgetController::class, 'store']);
    Route::put('budgets/{budget}', [BudgetController::class, 'update']);
    Route::delete('budgets/{budget}', [BudgetController::class, 'destroy']);

    // Rucoy
    Route::prefix('rucoy')->group(function () {
        Route::get('dashboard', [RucoyDashboardController::class, 'index']);
        Route::apiResource('golds', GoldController::class)->except(['show', 'create', 'edit']);
        Route::post('golds/sell', [GoldController::class, 'sell']);
        Route::get('gold-logs', [GoldController::class, 'logs']);
        Route::apiResource('trades', TradeController::class)->except(['show', 'create', 'edit']);
        Route::apiResource('accounts', RucoyAccountController::class)
            ->except(['show', 'create', 'edit'])
            ->parameters(['accounts' => 'rucoyAccount']);
    });
});
