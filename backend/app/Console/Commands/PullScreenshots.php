<?php

namespace App\Console\Commands;

use App\Models\RucoyAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * After copying the server's database to this PC, the account screenshots it lists
 * still live only on the server. This downloads the missing ones (read-only on the server).
 */
class PullScreenshots extends Command
{
    protected $signature = 'screenshots:pull {--from= : Server base URL, e.g. http://100.127.178.84:8080 (default: SCREENSHOT_SOURCE_URL)}';

    protected $description = 'Download account screenshots that are in the database but missing on this machine';

    /** Only names Laravel generates: screenshots/<random>.<image ext>. Rejects anything path-like. */
    private const SAFE_PATH = '/^screenshots\/[A-Za-z0-9]{20,64}\.(jpe?g|png|webp)$/';

    private const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    private const MAX_BYTES = 5 * 1024 * 1024;

    public function handle(): int
    {
        $source = rtrim((string) ($this->option('from') ?: config('services.screenshots.source_url')), '/');
        if ($source === '' || ! preg_match('#^https?://#', $source)) {
            $this->error('Set SCREENSHOT_SOURCE_URL in .env (e.g. http://100.127.178.84:8080) or pass --from=.');

            return self::FAILURE;
        }

        $disk  = Storage::disk('public');
        $paths = RucoyAccount::whereNotNull('screenshot')->pluck('screenshot')->unique();

        // Check names before touching the disk or the network
        [$safe, $unsafe] = $paths->partition(fn (string $p) => preg_match(self::SAFE_PATH, $p) === 1);
        foreach ($unsafe as $path) {
            $this->warn("Skipped unexpected path: {$path}");
        }

        $missing = $safe->reject(fn (string $p) => $disk->exists($p));
        if ($missing->isEmpty()) {
            $this->info("All {$safe->count()} screenshots are already here.");

            return $unsafe->isEmpty() ? self::SUCCESS : self::FAILURE;
        }

        $pulled = 0;
        $failed = $unsafe->count();
        foreach ($missing as $path) {
            try {
                $res  = Http::timeout(30)->get("{$source}/storage/{$path}");
                $type = strtolower(trim(explode(';', (string) $res->header('Content-Type'))[0]));
                $body = $res->body();

                // Never trust the response: it must really be an image of a sane size
                $sniffed = (new \finfo(FILEINFO_MIME_TYPE))->buffer($body);
                if (! $res->successful() || ! in_array($type, self::IMAGE_TYPES, true)
                    || ! in_array($sniffed, self::IMAGE_TYPES, true) || strlen($body) > self::MAX_BYTES) {
                    $this->warn("Could not get {$path} (HTTP {$res->status()}, {$type}).");
                    $failed++;

                    continue;
                }

                $disk->put($path, $body);
                $pulled++;
            } catch (Throwable $e) {
                $this->warn("Could not get {$path}: {$e->getMessage()}");
                $failed++;
            }
        }

        $this->info("Downloaded {$pulled} of {$missing->count()} missing screenshots from {$source}.");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
