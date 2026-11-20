<?php

namespace App\Services;

use App\Models\RucoyAccount;
use Carbon\CarbonImmutable;
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

    /** Gold rates set in Listing Kit */
    public const GOLD = 'src/data/gold.json';

    /** Trust numbers from your sales */
    public const STATS = 'src/data/site-stats.json';

    /** Everything this app writes in the website repo (and the only paths it ever commits) */
    private const PATHS = [self::JSON, self::IMAGES, self::GOLD, self::STATS];

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
            // For the website's "New" badge
            if ($a->listed_at) {
                $item['listed_at'] = $a->listed_at->setTimezone(BalanceInterest::ZONE)->toDateString();
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

    /** What's for sale now, as the website shows it (with price drops): for the Discord card. */
    public function forSale(): array
    {
        $listings = array_map(fn ($l) => array_diff_key($l, ['_screenshot' => true]), $this->build()['listings']);

        return $this->configured()
            ? self::markPriceDrops($listings, $this->readJson(self::JSON), now(BalanceInterest::ZONE)->toDateString())
            : $listings;
    }

    /**
     * Write, commit and push. $kitImage: the Listing Kit image drawn in the app (with its caption),
     * posted to your Discord listings channel when what's for sale changed.
     *
     * @param  array{contents: string, name: string, caption: string}|null  $kitImage
     * @return array{count: int, changed: bool, pushed: bool, commit: ?string, alerted: ?int, discord: array<string, bool>}
     */
    public function publish(?array $kitImage = null): array
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

        $today     = now(BalanceInterest::ZONE)->toDateString();
        $published = $this->readJson(self::JSON);
        $json = array_map(fn ($l) => array_diff_key($l, ['_screenshot' => true]), $built['listings']);
        $json = self::markPriceDrops($json, $published, $today);
        // Worked out now, against what the website had before: did what's for sale change?
        $forSaleChanged = ListingAnnouncer::listingsChanged($json, $published);
        $this->writeJson(self::JSON, $json);
        $this->writeJson(self::GOLD, WebsiteContent::gold());
        $stats = WebsiteContent::stats();
        $this->writeJson(self::STATS, $stats);

        // Commit only these files, never anything else you're working on in that repo
        $this->git(['add', '-A', '--', ...self::PATHS]);
        $changed = trim($this->git(['status', '--porcelain', '--', ...self::PATHS])) !== '';
        $staged  = trim($this->git(['diff', '--cached', '--name-only', '--', ...self::PATHS])) !== '';
        $commit  = null;
        if ($staged) {
            $count = count($json);
            $this->git(['commit', '-m', "Update listings: {$count} for sale", '--', ...self::PATHS]);
            $commit = trim($this->git(['rev-parse', '--short', 'HEAD']));
        }

        $pushed = false;
        if (config('listing.push') && ($staged || $this->ahead())) {
            $this->git(['push'], 120);
            $pushed = true;
        }

        // Buyers who asked to be notified: the website posts the matches to Discord (never blocks the publish)
        $alerted = WebsiteStats::dispatchAlerts($json);

        // The Listing Kit image → your Discord listings channel, when what's for sale changed
        // (also never blocks the publish)
        $result = $forSaleChanged && $kitImage !== null && ListingAnnouncer::configured()
            ? ListingAnnouncer::postImage($kitImage['contents'], $kitImage['name'], $kitImage['caption'],
                ListingAnnouncer::embed($json, $kitImage['caption'], $stats['reply_minutes'] ?? null, $kitImage['name'], $today))
            : ['sent' => 0, 'total' => count(ListingAnnouncer::webhooks())];

        return [
            'count' => count($json), 'changed' => $changed || $staged, 'pushed' => $pushed, 'commit' => $commit, 'alerted' => $alerted,
            // So the app can say what happened on Discord: off, nothing changed, posted (to how many
            // channels), or it failed
            'discord' => [
                'on' => ListingAnnouncer::configured(), 'changed' => $forSaleChanged, 'image' => $kitImage !== null,
                'posted' => $result['sent'] > 0, 'sent' => $result['sent'], 'total' => $result['total'],
            ],
        ];
    }

    /** How long a "Price dropped" badge stays up */
    public const PRICE_DROP_DAYS = 14;

    /**
     * Compare with what's on the website now: a listing whose price went down gets price_was (the
     * old price) and price_dropped_at, kept for PRICE_DROP_DAYS while the price stays the same.
     * Prices are only compared in the same unit (gold with gold, $ with $, ₱ with ₱).
     */
    public static function markPriceDrops(array $listings, array $published, string $today): array
    {
        $before = collect($published)->filter(fn ($l) => is_array($l) && isset($l['id']))->keyBy('id');

        return array_map(function (array $l) use ($before, $today) {
            $old = $before->get($l['id']);
            $now = isset($l['price']) ? self::priceValue($l['price']) : null;
            $was = isset($old['price']) ? self::priceValue($old['price']) : null;

            if ($now && $was && $now[0] === $was[0] && $now[1] < $was[1]) {
                return [...$l, 'price_was' => $old['price'], 'price_dropped_at' => $today];
            }
            // Still the same lower price: keep the badge until it's old
            if ($old && isset($old['price_was'], $old['price_dropped_at'], $l['price']) && $old['price'] === $l['price']
                && CarbonImmutable::parse($old['price_dropped_at'])->diffInDays(CarbonImmutable::parse($today)) < self::PRICE_DROP_DAYS) {
                return [...$l, 'price_was' => $old['price_was'], 'price_dropped_at' => $old['price_dropped_at']];
            }

            return $l;
        }, $listings);
    }

    /** "1.8KKK" → ['G', 1800000000], "$300" → ['$', 300], "₱1,500" → ['₱', 1500]; null if unreadable. */
    public static function priceValue(string $price): ?array
    {
        if (preg_match('/^([$₱])([\d,]+(?:\.\d+)?)$/u', trim($price), $m)) {
            return [$m[1], (float) str_replace(',', '', $m[2])];
        }
        if (preg_match('/^(\d+(?:\.\d+)?)(KKK|KK|K)?$/', trim($price), $m)) {
            return ['G', (float) $m[1] * ['KKK' => 1e9, 'KK' => 1e6, 'K' => 1e3, '' => 1][$m[2] ?? '']];
        }

        return null;
    }

    /** A JSON file in the website repo, or [] if it isn't there or can't be read. */
    private function readJson(string $path): array
    {
        $file = $this->sitePath . '/' . $path;
        $data = is_file($file) ? json_decode((string) File::get($file), true) : null;

        return is_array($data) ? $data : [];
    }

    private function writeJson(string $path, mixed $data): void
    {
        File::ensureDirectoryExists(dirname($this->sitePath . '/' . $path));
        File::put($this->sitePath . '/' . $path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");
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
