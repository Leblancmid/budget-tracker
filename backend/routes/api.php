<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\Business\BusinessDashboardController;
use App\Http\Controllers\Api\Business\BusinessTransactionController;
use App\Http\Controllers\Api\Business\InsightsController;
use App\Http\Controllers\Api\Business\ListingPublishController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\Master\BalanceAccountController;
use App\Http\Controllers\Api\Master\BalanceEntryController;
use App\Http\Controllers\Api\Master\BalanceTransferController;
use App\Http\Controllers\Api\Master\MasterDashboardController;
use App\Http\Controllers\Api\RecurringEntryController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\Rucoy\AccountPaymentController;
use App\Http\Controllers\Api\Rucoy\GoldController;
use App\Http\Controllers\Api\Rucoy\MiddlemanFeeController;
use App\Http\Controllers\Api\Rucoy\RucoyAccountController;
use App\Http\Controllers\Api\Rucoy\RucoyDashboardController;
use App\Http\Controllers\Api\Rucoy\TradeController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public
    // Per-email lockout lives in LoginRequest; this caps attempts per IP across all emails
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:20,1')->name('auth.login');

    // Protected
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::post('auth/logout-all', [AuthController::class, 'logoutAll'])->name('auth.logout-all');

        // Daily Expenses (every signed-in user, scoped to their own data)
        Route::get('reports/daily-expenses', [ReportController::class, 'dailyExpenses'])->name('reports.daily-expenses');
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('transactions', TransactionController::class);
        Route::apiResource('budgets', BudgetController::class)->except(['show']);
        Route::apiResource('recurring-entries', RecurringEntryController::class)->except(['show'])
            ->parameters(['recurring-entries' => 'recurringEntry']);

        // Everything below is admin-only: daily_only users get 403
        Route::middleware('admin')->group(function () {

            // Logs
            Route::get('logs', [LogController::class, 'index'])->name('logs.index');

            // Business report
            Route::get('reports/business', [ReportController::class, 'business'])->name('reports.business');

            // Master
            Route::prefix('master')->name('master.')->group(function () {
                Route::get('dashboard', [MasterDashboardController::class, 'index'])->name('dashboard');
                Route::apiResource('balance-entries', BalanceEntryController::class)->except(['show']);
                Route::apiResource('balance-transfers', BalanceTransferController::class)->only(['store', 'destroy']);
                Route::post('balance-accounts/{balanceAccount}/check', [BalanceAccountController::class, 'check'])->name('balance-accounts.check');
                Route::post('balance-accounts/reorder', [BalanceAccountController::class, 'reorder'])->name('balance-accounts.reorder');
                Route::apiResource('balance-accounts', BalanceAccountController::class)->except(['show']);
            });

            // Business
            Route::prefix('business')->name('business.')->group(function () {
                Route::get('dashboard', [BusinessDashboardController::class, 'index'])->name('dashboard');
                Route::get('brief', [InsightsController::class, 'brief'])->name('brief');
                Route::get('price-guide', [InsightsController::class, 'priceGuide'])->name('price-guide');
                // Accounts for sale → the Leblanc website (git push → Vercel)
                Route::get('listing/publish', [ListingPublishController::class, 'preview'])->name('listing.preview');
                Route::post('listing/publish', [ListingPublishController::class, 'publish'])->middleware('throttle:6,1')->name('listing.publish');
                Route::get('website-stats', [ListingPublishController::class, 'stats'])->name('website-stats');
                Route::delete('website-alerts/{alert}', [ListingPublishController::class, 'deleteAlert'])->whereNumber('alert')->name('website-alerts.destroy');
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
                // Payments toward an account's cost (gold from a trade, or cash from a wallet)
                Route::scopeBindings()->group(function () {
                    Route::post('accounts/{rucoyAccount}/payments', [AccountPaymentController::class, 'store'])->name('accounts.payments.store');
                    Route::delete('accounts/{rucoyAccount}/payments/{payment}', [AccountPaymentController::class, 'destroy'])->name('accounts.payments.destroy');
                });

                Route::apiResource('accounts', RucoyAccountController::class)
                    ->except(['show'])
                    ->parameters(['accounts' => 'rucoyAccount']);
            });

        }); // admin
    });
});
