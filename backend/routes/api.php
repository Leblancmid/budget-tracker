<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\Business\BusinessDashboardController;
use App\Http\Controllers\Api\Business\BusinessTransactionController;
use App\Http\Controllers\Api\Business\InsightsController;
use App\Http\Controllers\Api\Business\LeadController;
use App\Http\Controllers\Api\Business\ListingPublishController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\Master\BalanceAccountController;
use App\Http\Controllers\Api\Master\BalanceEntryController;
use App\Http\Controllers\Api\Master\BalanceTransferController;
use App\Http\Controllers\Api\Master\MasterDashboardController;
use App\Http\Controllers\Api\Master\OperationController;
use App\Http\Controllers\Api\RecurringEntryController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\Rucoy\AccountPaymentController;
use App\Http\Controllers\Api\Rucoy\GoldController;
use App\Http\Controllers\Api\Rucoy\MiddlemanFeeController;
use App\Http\Controllers\Api\Rucoy\RucoyAccountController;
use App\Http\Controllers\Api\Rucoy\RucoyDashboardController;
use App\Http\Controllers\Api\Rucoy\TradeController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PushController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public
    // Per-email lockout lives in LoginRequest; this caps attempts per IP across all emails
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:20,1')->name('auth.login');

    // Protected
    // Protected (a password an admin chose must be replaced first: see EnsurePasswordChosen)
    Route::middleware(['auth:sanctum', 'password.chosen'])->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::post('auth/logout-all', [AuthController::class, 'logoutAll'])->name('auth.logout-all');

        // Your in-app notifications (the bell)
        Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
        Route::post('notifications/read-all', [NotificationController::class, 'readAll'])->name('notifications.read-all');
        Route::post('notifications/{notification}/read', [NotificationController::class, 'read'])->whereUuid('notification')->name('notifications.read');

        // Your own profile (every signed-in user)
        Route::prefix('profile')->name('profile.')->group(function () {
            Route::get('/', [ProfileController::class, 'show'])->name('show');
            Route::patch('/', [ProfileController::class, 'update'])->name('update');
            Route::post('avatar', [ProfileController::class, 'updateAvatar'])->middleware('throttle:10,1')->name('avatar.update');
            Route::delete('avatar', [ProfileController::class, 'destroyAvatar'])->name('avatar.destroy');
            Route::put('password', [ProfileController::class, 'updatePassword'])->middleware('throttle:6,1')->name('password.update');
            Route::delete('sessions/{token}', [ProfileController::class, 'destroySession'])->whereNumber('token')->name('sessions.destroy');
            // Phone alerts for this device
            Route::get('push', [PushController::class, 'show'])->name('push.show');
            Route::post('push', [PushController::class, 'store'])->middleware('throttle:10,1')->name('push.store');
            Route::delete('push', [PushController::class, 'destroy'])->name('push.destroy');
            Route::post('push/test', [PushController::class, 'test'])->middleware('throttle:5,1')->name('push.test');
        });

        // Daily Expenses (every signed-in user, scoped to their own data)
        Route::get('reports/daily-expenses', [ReportController::class, 'dailyExpenses'])->name('reports.daily-expenses');
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::get('dashboard/brief', [DashboardController::class, 'brief'])->name('dashboard.brief');
        Route::apiResource('categories', CategoryController::class);
        Route::apiResource('transactions', TransactionController::class);
        Route::apiResource('budgets', BudgetController::class)->except(['show']);
        Route::apiResource('recurring-entries', RecurringEntryController::class)->except(['show'])
            ->parameters(['recurring-entries' => 'recurringEntry']);

        // Users: admins only (add, edit, set a password, turn off / on; never deleted, see UserController)
        Route::middleware('admin')->group(function () {
            Route::apiResource('users', UserController::class)->only(['index', 'store', 'show', 'update']);
            Route::delete('users/{user}/sessions/{token}', [UserController::class, 'destroySession'])->whereNumber('token')->name('users.sessions.destroy');
            Route::post('users/{user}/sign-out-everywhere', [UserController::class, 'signOutEverywhere'])->name('users.sign-out-everywhere');
            Route::put('users/{user}/password', [UserController::class, 'updatePassword'])->middleware('throttle:10,1')->name('users.password');
            Route::post('users/{user}/deactivate', [UserController::class, 'deactivate'])->name('users.deactivate');
            Route::post('users/{user}/reactivate', [UserController::class, 'reactivate'])->name('users.reactivate');
        });

        // Master File: the net worth overview, everyone's logs, and undo
        Route::middleware('module:master')->group(function () {
            Route::get('logs', [LogController::class, 'index'])->name('logs.index');
            Route::prefix('master')->name('master.')->group(function () {
                Route::get('dashboard', [MasterDashboardController::class, 'index'])->name('dashboard');
                Route::get('dashboard/trend', [MasterDashboardController::class, 'trend'])->name('dashboard.trend');
                // Undo: everything done in the app, newest first
                Route::get('operations', [OperationController::class, 'index'])->name('operations.index');
                Route::post('operations/{operation}/undo', [OperationController::class, 'undo'])->name('operations.undo');
                Route::post('operations/{operation}/redo', [OperationController::class, 'redo'])->name('operations.redo');
            });
        });

        // Wallets (the Balance page). Trading also reads the wallet list: sales are paid into wallets
        Route::prefix('master')->name('master.')->group(function () {
            Route::get('balance-accounts', [BalanceAccountController::class, 'index'])->middleware('module:wallets,trading')->name('balance-accounts.index');
            Route::middleware('module:wallets')->group(function () {
                Route::apiResource('balance-entries', BalanceEntryController::class)->except(['show']);
                Route::apiResource('balance-transfers', BalanceTransferController::class)->only(['store', 'destroy']);
                Route::post('balance-accounts/{balanceAccount}/check', [BalanceAccountController::class, 'check'])->name('balance-accounts.check');
                Route::post('balance-accounts/reorder', [BalanceAccountController::class, 'reorder'])->name('balance-accounts.reorder');
                Route::apiResource('balance-accounts', BalanceAccountController::class)->except(['index', 'show']);
            });
        });

        // Trading: Business and Rucoy (each screen uses the other's data), and the business report
        Route::middleware('module:trading')->group(function () {

            // Business report
            Route::get('reports/business', [ReportController::class, 'business'])->name('reports.business');

            // Business
            Route::prefix('business')->name('business.')->group(function () {
                Route::get('dashboard', [BusinessDashboardController::class, 'index'])->name('dashboard');
                Route::get('brief', [InsightsController::class, 'brief'])->name('brief');
                Route::get('price-guide', [InsightsController::class, 'priceGuide'])->name('price-guide');
                // Storefront: what the public website shows and what comes in from it. Given separately
                // (on top of Trading), since publishing and website prices are seen by buyers
                Route::middleware('module:storefront')->group(function () {
                    // Accounts for sale → the Leblanc website (git push → Vercel)
                    Route::get('listing/publish', [ListingPublishController::class, 'preview'])->name('listing.preview');
                    Route::post('listing/publish', [ListingPublishController::class, 'publish'])->middleware('throttle:6,1')->name('listing.publish');
                    Route::get('website-stats', [ListingPublishController::class, 'stats'])->name('website-stats');
                    // Leads from the website (I want this, gold orders, accounts offered to you)
                    Route::get('leads', [LeadController::class, 'index'])->name('leads.index');
                    Route::patch('leads/{lead}', [LeadController::class, 'update'])->whereNumber('lead')->name('leads.update');
                    Route::get('website-gold', [ListingPublishController::class, 'goldRates'])->name('website-gold.show');
                    Route::put('website-gold', [ListingPublishController::class, 'updateGoldRates'])->name('website-gold.update');
                    Route::delete('website-alerts/{alert}', [ListingPublishController::class, 'deleteAlert'])->whereNumber('alert')->name('website-alerts.destroy');
                });
                Route::apiResource('transactions', BusinessTransactionController::class)
                    ->except(['show'])
                    ->parameters(['transactions' => 'businessTransaction']);
                Route::controller(BusinessTransactionController::class)->prefix('transactions')->name('transactions.')->group(function () {
                    Route::get('summary', 'summary')->name('summary');
                    Route::get('archived', 'archived')->name('archived');
                    Route::get('buyers', 'buyers')->name('buyers');
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

        }); // trading
    });
});
