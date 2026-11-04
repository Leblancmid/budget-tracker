<?php

namespace App\Services;

use App\Models\RucoyAccount;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\Process\Process;

/**
 * Publishes the accounts for sale to the Leblanc website: writes src/data/listings.json and
 * copies each screenshot to public/listings/, then commits (only those paths) and pushes, so
 * Vercel redeploys. Sold accounts drop off because only unsold ones are written.
 *
 * Same rules as the Listing Kit: an account needs a screenshot to be listed, and its price is
 * shown only when "Show price" is ticked.
 */
class ListingPublisher
{
    public const JSON = 'src/data/listings.json';

    public const IMAGES = 'public/listings';

    private const CATEGORY = ['melee' => 'Melee', 'distance' => 'Distance', 'magic' => 'Magic'];

    public function __construct(private ?string $sitePath = null)
    {
        $this->sitePath ??= config('listing.site_path');
    }

    public function configured(): bool
    {
        return $this->sitePath !== null && $this->sitePath !== '' && is_dir($this->sitePath . '/.git');
    }

    /**
     * What would be published, and what's skipped and why.
     *
     * @return array{listings: list<array<string, mixed>>, skipped: list<array{id: int, name: string, reason: string}>}
     */
    public function build(): array
    {
        $listings = [];
        $skipped  = [];
        $accounts = RucoyAccount::active()->orderByDesc('level')->orderByDesc('id')->get();

        foreach ($accounts as $a) {
            $name     = $a->description ?: $a->email;
            $level    = PriceGuide::levelOf($a);
            $class    = PriceGuide::classOf($a);
            $reason   = match (true) {
                ! $a->screenshot || ! Storage::disk('public')->exists($a->screenshot) => 'No screenshot',
                ! $level => 'No level',
                ! $class => 'No class (fill in the stats, or put Melee / Dist / Magic in the name)',
                default  => null,
            };
            if ($reason) {
                $skipped[] = ['id' => $a->id, 'name' => $name, 'reason' => $reason];

                continue;
            }

            $item = [
                'id'       => 'acc-' . $a->id,
                'category' => self::CATEGORY[$class],
                'level'    => $level,
            ];
            if ($a->melee !== null && $a->distance !== null && $a->magic !== null && $a->defense !== null) {
                $item['stats'] = ['melee' => $a->melee, 'distance' => $a->distance, 'magic' => $a->magic, 'defense' => $a->defense];
            }
            $item['image'] = '/listings/acc-' . $a->id . '.' . strtolower(pathinfo($a->screenshot, PATHINFO_EXTENSION) ?: 'jpg');
            if ($price = self::price($a)) {
                $item['price'] = $price;
            }
            $item['_screenshot'] = $a->screenshot;
            $listings[] = $item;
        }

        // The highest levels lead the home page
        usort($listings, fn ($x, $y) => $y['level'] <=> $x['level']);
        foreach ($listings as $i => &$item) {
            if ($i < (int) config('listing.featured', 3)) {
                $item['featured'] = true;
            }
        }
        unset($item);

        return ['listings' => $listings, 'skipped' => $skipped];
    }

    /** Preview for the app: the listings (without internal fields) and the skipped accounts. */
    public function preview(): array
    {
        $built = $this->build();

        return [
            'configured' => $this->configured(),
            'listings'   => array_map(fn ($l) => array_diff_key($l, ['_screenshot' => true]), $built['listings']),
            'skipped'    => $built['skipped'],
        ];
    }

    /**
     * Write, commit and push.
     *
     * @return array{count: int, changed: bool, pushed: bool, commit: ?string}
     */
    public function publish(): array
    {
        if (! $this->configured()) {
            throw new RuntimeException('Publishing is off: set LISTING_SITE_PATH in the backend .env to the Leblanc repo folder.');
        }
        // Get changes pushed from another computer first (e.g. site edits made on your PC),
        // so this push isn't rejected
        if ($this->hasUpstream()) {
            $this->git(['pull', '--rebase', '--autostash'], 120);
        }
        $built = $this->build();

        // Images: copy the current screenshots, remove ones of accounts no longer listed
        $dir = $this->sitePath . '/' . self::IMAGES;
        File::ensureDirectoryExists($dir);
        $keep = [];
        foreach ($built['listings'] as $l) {
            $file   = basename($l['image']);
            $keep[] = $file;
            $source = Storage::disk('public')->path($l['_screenshot']);
            $target = $dir . '/' . $file;
            if (! is_file($target) || md5_file($target) !== md5_file($source)) {
                File::copy($source, $target);
            }
        }
        foreach (File::files($dir) as $f) {
            if (! in_array($f->getFilename(), $keep, true)) {
                File::delete($f->getPathname());
            }
        }

        $json = array_map(fn ($l) => array_diff_key($l, ['_screenshot' => true]), $built['listings']);
        File::put($this->sitePath . '/' . self::JSON, json_encode($json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");

        // Commit only the listing files, never anything else you're working on in that repo
        $this->git(['add', '-A', '--', self::JSON, self::IMAGES]);
        $changed = trim($this->git(['status', '--porcelain', '--', self::JSON, self::IMAGES])) !== '';
        $staged  = trim($this->git(['diff', '--cached', '--name-only', '--', self::JSON, self::IMAGES])) !== '';
        $commit  = null;
        if ($staged) {
            $count = count($json);
            $this->git(['commit', '-m', "Update listings: {$count} for sale", '--', self::JSON, self::IMAGES]);
            $commit = trim($this->git(['rev-parse', '--short', 'HEAD']));
        }

        $pushed = false;
        if (config('listing.push') && ($staged || $this->ahead())) {
            $this->git(['push'], 120);
            $pushed = true;
        }

        return ['count' => count($json), 'changed' => $changed || $staged, 'pushed' => $pushed, 'commit' => $commit];
    }

    /** The repo tracks a GitHub branch (false for a local-only repo). */
    private function hasUpstream(): bool
    {
        try {
            $this->git(['rev-parse', '--abbrev-ref', '@{u}']);

            return true;
        } catch (RuntimeException) {
            return false;
        }
    }

    /** Local commits not pushed yet (e.g. a push that failed last time). */
    private function ahead(): bool
    {
        try {
            return (int) trim($this->git(['rev-list', '--count', '@{u}..HEAD'])) > 0;
        } catch (RuntimeException) {
            return false;
        }
    }

    private function git(array $args, int $timeout = 30): string
    {
        $process = new Process(['git', ...$args], $this->sitePath, ['GIT_TERMINAL_PROMPT' => '0']);
        $process->setTimeout($timeout);
        $process->run();
        if (! $process->isSuccessful()) {
            throw new RuntimeException('git ' . $args[0] . ' failed: ' . trim($process->getErrorOutput() ?: $process->getOutput()));
        }

        return $process->getOutput();
    }

    /** The price buyers see, or null to show "On request" (same rule as the Listing Kit). */
    public static function price(RucoyAccount $a): ?string
    {
        if (! $a->show_price) {
            return null;
        }
        if ($a->isCash()) {
            return $a->price_cash ? ($a->cash_currency === 'USD' ? '$' : '₱') . self::trimNumber($a->price_cash, 2, true) : null;
        }

        return $a->price ? self::goldShort($a->price) : null;
    }

    /** 700000000 → "700KK", 1800000000 → "1.8KKK" (same as the Listing Kit). */
    public static function goldShort(float $gold): string
    {
        foreach ([[1e9, 'KKK'], [1e6, 'KK'], [1e3, 'K']] as [$size, $suffix]) {
            if ($gold >= $size) {
                return self::trimNumber(round($gold / $size, 2), 2) . $suffix;
            }
        }

        return (string) round($gold);
    }

    private static function trimNumber(float $n, int $decimals, bool $thousands = false): string
    {
        return rtrim(rtrim(number_format($n, $decimals, '.', $thousands ? ',' : ''), '0'), '.');
    }
}
