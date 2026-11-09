<?php

namespace App\Services\Backup;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Minimal Cloudflare R2 client (S3-compatible API, AWS Signature V4): upload, list, delete.
 * Written by hand so the app doesn't need the large AWS SDK for three calls.
 */
class R2Client
{
    private const REGION = 'auto';

    public function __construct(
        private string $endpoint,   // https://<account>.r2.cloudflarestorage.com
        private string $bucket,
        private string $key,
        private string $secret,
    ) {}

    public static function fromConfig(): self
    {
        $c = config('backup.r2');
        foreach (['account_id', 'key', 'secret', 'bucket'] as $field) {
            if (empty($c[$field])) {
                throw new RuntimeException('Off-site backup is not set up: BACKUP_R2_' . strtoupper($field === 'key' ? 'ACCESS_KEY_ID' : ($field === 'secret' ? 'SECRET_ACCESS_KEY' : $field)) . ' is missing in .env.');
            }
        }

        return new self("https://{$c['account_id']}.r2.cloudflarestorage.com", $c['bucket'], $c['key'], $c['secret']);
    }

    public function put(string $objectKey, string $body): void
    {
        $res = $this->send('PUT', $objectKey, [], $body, ['content-type' => 'application/octet-stream']);
        if (! $res->successful()) {
            throw new RuntimeException('Upload to R2 failed (' . $res->status() . '): ' . self::errorOf($res->body()));
        }
    }

    /** @return list<array{key: string, size: int}> objects under $prefix, oldest key first */
    public function list(string $prefix): array
    {
        $objects = [];
        $token   = null;
        do {
            $query = ['list-type' => '2', 'prefix' => $prefix] + ($token ? ['continuation-token' => $token] : []);
            $res   = $this->send('GET', '', $query);
            if (! $res->successful()) {
                throw new RuntimeException('Listing R2 failed (' . $res->status() . '): ' . self::errorOf($res->body()));
            }
            $xml = simplexml_load_string($res->body());
            foreach ($xml->Contents ?? [] as $item) {
                $objects[] = ['key' => (string) $item->Key, 'size' => (int) $item->Size];
            }
            $token = (string) ($xml->IsTruncated ?? '') === 'true' ? (string) $xml->NextContinuationToken : null;
        } while ($token);

        usort($objects, fn ($a, $b) => strcmp($a['key'], $b['key']));

        return $objects;
    }

    public function delete(string $objectKey): void
    {
        $res = $this->send('DELETE', $objectKey);
        if (! $res->successful() && $res->status() !== 404) {
            throw new RuntimeException('Deleting from R2 failed (' . $res->status() . ').');
        }
    }

    private function send(string $method, string $objectKey, array $query = [], string $body = '', array $extraHeaders = [])
    {
        $path    = '/' . $this->bucket . ($objectKey !== '' ? '/' . $objectKey : '');
        $host    = parse_url($this->endpoint, PHP_URL_HOST);
        $headers = self::sign($method, $host, $path, $query, $extraHeaders, hash('sha256', $body), $this->key, $this->secret, self::REGION, gmdate('Ymd\THis\Z'));
        $url     = $this->endpoint . self::encodePath($path) . ($query ? '?' . self::canonicalQuery($query) : '');

        return Http::withHeaders($headers)->timeout(60)->withBody($body, $extraHeaders['content-type'] ?? 'application/octet-stream')
            ->send($method, $url);
    }

    /**
     * AWS Signature V4 headers for an S3-style request (public so it can be checked against
     * AWS's published example).
     *
     * @return array<string, string> headers to send, including Authorization
     */
    public static function sign(string $method, string $host, string $path, array $query, array $headers, string $payloadHash,
        string $key, string $secret, string $region, string $amzDate): array
    {
        $date    = substr($amzDate, 0, 8);
        $headers = array_change_key_case($headers + ['host' => $host, 'x-amz-content-sha256' => $payloadHash, 'x-amz-date' => $amzDate]);
        ksort($headers);
        $canonicalHeaders = '';
        foreach ($headers as $name => $value) {
            $canonicalHeaders .= $name . ':' . trim((string) $value) . "\n";
        }
        $signed = implode(';', array_keys($headers));

        $canonical = implode("\n", [$method, self::encodePath($path), self::canonicalQuery($query), $canonicalHeaders, $signed, $payloadHash]);
        $scope     = "{$date}/{$region}/s3/aws4_request";
        $toSign    = implode("\n", ['AWS4-HMAC-SHA256', $amzDate, $scope, hash('sha256', $canonical)]);

        $k = hash_hmac('sha256', $date, 'AWS4' . $secret, true);
        $k = hash_hmac('sha256', $region, $k, true);
        $k = hash_hmac('sha256', 's3', $k, true);
        $k = hash_hmac('sha256', 'aws4_request', $k, true);
        $signature = hash_hmac('sha256', $toSign, $k);

        unset($headers['host']); // the HTTP client sets it
        $headers['authorization'] = "AWS4-HMAC-SHA256 Credential={$key}/{$scope}, SignedHeaders={$signed}, Signature={$signature}";

        return $headers;
    }

    private static function encodePath(string $path): string
    {
        return implode('/', array_map('rawurlencode', explode('/', $path)));
    }

    private static function canonicalQuery(array $query): string
    {
        ksort($query);

        return implode('&', array_map(fn ($k, $v) => rawurlencode((string) $k) . '=' . rawurlencode((string) $v), array_keys($query), $query));
    }

    private static function errorOf(string $xml): string
    {
        return preg_match('/<Message>(.*?)<\/Message>/s', $xml, $m) ? $m[1] : substr(strip_tags($xml), 0, 200);
    }
}
