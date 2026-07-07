<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\Master\MasterDashboardController;
use App\Http\Controllers\Api\Master\SavingController;
use App\Http\Controllers\Api\Business\BusinessDashboardController;
use App\Http\Controllers\Api\Business\BusinessTransactionController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\Rucoy\GoldController;
use App\Http\Controllers\Api\Rucoy\RucoyAccountController;
use App\Http\Controllers\Api\Rucoy\RucoyDashboardController;
use App\Http\Controllers\Api\Rucoy\TradeController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Auth
    Route::post('auth/login',  [AuthController::class, 'login']);
    Route::post('auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

    // Budget Tracker
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('transactions', TransactionController::class);
    Route::get('budgets', [BudgetController::class, 'index']);
    Route::post('budgets', [BudgetController::class, 'store']);
    Route::put('budgets/{budget}', [BudgetController::class, 'update']);
    Route::delete('budgets/{budget}', [BudgetController::class, 'destroy']);

    // Master
    Route::prefix('master')->group(function () {
        Route::get('dashboard', [MasterDashboardController::class, 'index']);
        Route::apiResource('savings', SavingController::class)->except(['show', 'create', 'edit']);
    });

    // Business
    Route::prefix('business')->group(function () {
        Route::get('dashboard', [BusinessDashboardController::class, 'index']);
        Route::apiResource('transactions', BusinessTransactionController::class)
            ->except(['show', 'create', 'edit'])
            ->parameters(['transactions' => 'businessTransaction']);
        Route::get('transactions/archived', [BusinessTransactionController::class, 'archived']);
        Route::post('transactions/{businessTransaction}/archive', [BusinessTransactionController::class, 'archive']);
        Route::post('transactions/{businessTransaction}/unarchive', [BusinessTransactionController::class, 'unarchive']);
    });

    // Rucoy
    Route::prefix('rucoy')->group(function () {
        Route::get('dashboard', [RucoyDashboardController::class, 'index']);
        Route::apiResource('golds', GoldController::class)->except(['show', 'create', 'edit']);
        Route::post('golds/sell', [GoldController::class, 'sell']);
        Route::get('gold-logs', [GoldController::class, 'logs']);
        Route::get('trades/archived', [TradeController::class, 'archived']);
        Route::post('trades/{trade}/archive', [TradeController::class, 'archive']);
        Route::post('trades/{trade}/unarchive', [TradeController::class, 'unarchive']);
        Route::apiResource('trades', TradeController::class)->except(['show', 'create', 'edit']);
        Route::get('accounts/archived', [RucoyAccountController::class, 'archived']);
        Route::post('accounts/{rucoyAccount}/archive', [RucoyAccountController::class, 'archive']);
        Route::post('accounts/{rucoyAccount}/unarchive', [RucoyAccountController::class, 'unarchive']);
        Route::apiResource('accounts', RucoyAccountController::class)
            ->except(['show', 'create', 'edit'])
            ->parameters(['accounts' => 'rucoyAccount']);
    });
});
