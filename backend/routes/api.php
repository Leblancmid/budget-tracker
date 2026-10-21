<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\Business\BusinessDashboardController;
use App\Http\Controllers\Api\Business\BusinessTransactionController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\Master\BalanceAccountController;
use App\Http\Controllers\Api\Master\BalanceEntryController;
use App\Http\Controllers\Api\Master\MasterDashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\Rucoy\GoldController;
use App\Http\Controllers\Api\Rucoy\MiddlemanFeeController;
use App\Http\Controllers\Api\Rucoy\RucoyAccountController;
use App\Http\Controllers\Api\Rucoy\RucoyDashboardController;
use App\Http\Controllers\Api\Rucoy\TradeController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public
    Route::post('auth/login', [AuthController::class, 'login'])->name('auth.login');

    // Protected
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

        // Logs
        Route::get('logs', [LogController::class, 'index'])->name('logs.index');

        // Reports
        Route::prefix('reports')->name('reports.')->controller(ReportController::class)->group(function () {
            Route::get('daily-expenses', 'dailyExpenses')->name('daily-expenses');
            Route::get('business', 'business')->name('business');
        });

        // Daily Expenses
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('transactions', TransactionController::class);
        Route::apiResource('budgets', BudgetController::class)->except(['show']);

        // Master
        Route::prefix('master')->name('master.')->group(function () {
            Route::get('dashboard', [MasterDashboardController::class, 'index'])->name('dashboard');
            Route::apiResource('balance-entries', BalanceEntryController::class)->except(['show']);
            Route::post('balance-accounts/reorder', [BalanceAccountController::class, 'reorder'])->name('balance-accounts.reorder');
            Route::apiResource('balance-accounts', BalanceAccountController::class)->except(['show']);
        });

        // Business
        Route::prefix('business')->name('business.')->group(function () {
            Route::get('dashboard', [BusinessDashboardController::class, 'index'])->name('dashboard');
            Route::apiResource('transactions', BusinessTransactionController::class)
                ->except(['show'])
                ->parameters(['transactions' => 'businessTransaction']);
            Route::controller(BusinessTransactionController::class)->prefix('transactions')->name('transactions.')->group(function () {
                Route::get('summary', 'summary')->name('summary');
                Route::get('archived', 'archived')->name('archived');
                Route::post('{businessTransaction}/archive', 'archive')->name('archive');
                Route::post('{businessTransaction}/unarchive', 'unarchive')->name('unarchive');
                Route::post('{businessTransaction}/sell', 'sell')->name('sell');
                Route::post('{businessTransaction}/add-gold', 'addGold')->name('add-gold');
            });
        });

        // Rucoy
        Route::prefix('rucoy')->name('rucoy.')->group(function () {
            Route::get('dashboard', [RucoyDashboardController::class, 'index'])->name('dashboard');

            Route::apiResource('golds', GoldController::class)->except(['show']);
            Route::controller(GoldController::class)->group(function () {
                Route::post('golds/sell', 'sell')->name('golds.sell');
                Route::post('golds/adjust', 'adjust')->name('golds.adjust');
                Route::get('gold-logs', 'logs')->name('gold-logs.index');
                Route::post('gold-logs/{goldLog}/cancel', 'cancelLog')->name('gold-logs.cancel');
            });

            Route::apiResource('middleman-fees', MiddlemanFeeController::class)
                ->only(['index', 'store', 'destroy'])
                ->parameters(['middleman-fees' => 'middlemanFee']);

            Route::controller(TradeController::class)->prefix('trades')->name('trades.')->group(function () {
                Route::get('archived', 'archived')->name('archived');
                Route::post('{trade}/archive', 'archive')->name('archive');
                Route::post('{trade}/unarchive', 'unarchive')->name('unarchive');
            });
            Route::apiResource('trades', TradeController::class)->except(['show']);

            Route::controller(RucoyAccountController::class)->prefix('accounts')->name('accounts.')->group(function () {
                Route::get('archived', 'archived')->name('archived');
                Route::post('{rucoyAccount}/archive', 'archive')->name('archive');
                Route::post('{rucoyAccount}/unarchive', 'unarchive')->name('unarchive');
            });
            Route::apiResource('accounts', RucoyAccountController::class)
                ->except(['show'])
                ->parameters(['accounts' => 'rucoyAccount']);
        });
    });
});
