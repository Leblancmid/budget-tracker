<?php

namespace App\Services\Backup;

use RuntimeException;

/**
 * Compress + encrypt a backup with a password (AES-256-GCM, key from PBKDF2), and back.
 * Separate from APP_KEY on purpose: if the server is lost, APP_KEY is lost with it, but you
 * still have BACKUP_PASSWORD.
 *
 * File layout: "LBK1" | salt (16) | iv (12) | tag (16) | ciphertext
 */
class BackupCrypto
{
    private const MAGIC = 'LBK1';

    private const ITERATIONS = 200_000;

    public static function encrypt(string $plain, string $password): string
    {
        self::checkPassword($password);
        $salt = random_bytes(16);
        $iv   = random_bytes(12);
        $tag  = '';
        $cipher = openssl_encrypt(gzencode($plain, 9), 'aes-256-gcm', self::key($password, $salt), OPENSSL_RAW_DATA, $iv, $tag);
        if ($cipher === false) {
            throw new RuntimeException('Encryption failed.');
        }

        return self::MAGIC . $salt . $iv . $tag . $cipher;
    }

    public static function decrypt(string $data, string $password): string
    {
        if (! str_starts_with($data, self::MAGIC) || strlen($data) < 48) {
            throw new RuntimeException('This is not a Budget backup file.');
        }
        $salt   = substr($data, 4, 16);
        $iv     = substr($data, 20, 12);
        $tag    = substr($data, 32, 16);
        $plain  = openssl_decrypt(substr($data, 48), 'aes-256-gcm', self::key($password, $salt), OPENSSL_RAW_DATA, $iv, $tag);
        if ($plain === false) {
            throw new RuntimeException('Wrong password, or the file is damaged.');
        }
        $sql = gzdecode($plain);
        if ($sql === false) {
            throw new RuntimeException('The file is damaged.');
        }

        return $sql;
    }

    public static function checkPassword(?string $password): void
    {
        if ($password === null || strlen($password) < 12) {
            throw new RuntimeException('BACKUP_PASSWORD must be set in .env and be at least 12 characters.');
        }
    }

    private static function key(string $password, string $salt): string
    {
        return hash_pbkdf2('sha256', $password, $salt, self::ITERATIONS, 32, true);
    }
}
