<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;
use Throwable;

/**
 * One-time setup for phone alerts: makes the key pair and prints the two .env lines. It never writes
 * .env itself (the server's settings are yours to change). Also says how to fix Windows PHP when it
 * can't make the keys.
 */
class PushKeys extends Command
{
    protected $signature = 'push:keys';

    protected $description = 'Make the keys for phone alerts (web push) and print the .env lines';

    public function handle(): int
    {
        if (config('services.webpush.public_key')) {
            $this->warn('Phone alerts already have keys. Making new ones would turn every device\'s alerts off (they\'d have to turn them on again).');
            if (! $this->confirm('Make new keys anyway?', false)) {
                return self::SUCCESS;
            }
        }

        try {
            $keys = VAPID::createVapidKeys();
        } catch (Throwable $e) {
            $conf = dirname(PHP_BINARY) . DIRECTORY_SEPARATOR . 'extras' . DIRECTORY_SEPARATOR . 'ssl' . DIRECTORY_SEPARATOR . 'openssl.cnf';
            $this->error('PHP couldn\'t make the keys: ' . $e->getMessage());
            if (PHP_OS_FAMILY === 'Windows') {
                $this->line('On Windows, PHP needs to know where OpenSSL\'s settings are. In PowerShell as administrator:');
                $this->line("  setx OPENSSL_CONF \"{$conf}\" /M");
                $this->line('Then close this window, restart Laragon (and the scheduler / queue services), and run this again.');
            }

            return self::FAILURE;
        }

        $this->info('Add these two lines to the server\'s .env, then run the deploy script (it refreshes the cached settings):');
        $this->newLine();
        $this->line('VAPID_PUBLIC_KEY=' . $keys['publicKey']);
        $this->line('VAPID_PRIVATE_KEY=' . $keys['privateKey']);
        $this->newLine();
        $this->warn('Keep the private key secret: don\'t commit it or paste it in chat.');

        return self::SUCCESS;
    }
}
