<?php

namespace App\Services;

use App\Models\ProofImage;
use App\Models\ProofTrade;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Screenshots for proven trades: each upload is decoded as an image (anything else is refused),
 * resized to FULL px wide and THUMB px wide, and saved as WebP under a random name. Re-encoding
 * also drops anything hidden in the file (camera data, location).
 */
class ProofImages
{
    public const FULL = 1600;

    public const THUMB = 600;

    public const DIR = 'proofs';

    /**
     * Refuse the whole upload if any file isn't a readable image, before anything is saved.
     *
     * @param  list<UploadedFile>  $files
     */
    public static function check(array $files): void
    {
        foreach ($files as $i => $file) {
            $img = @imagecreatefromstring((string) $file->get());
            if ($img === false) {
                throw new RuntimeException('Screenshot ' . ($i + 1) . ' isn\'t an image this app can read (use PNG, JPG or WebP).');
            }
        }
    }

    public static function add(ProofTrade $trade, UploadedFile $file): ProofImage
    {
        $source = @imagecreatefromstring((string) $file->get());
        if ($source === false) {
            throw new RuntimeException('That file isn\'t an image this app can read (use PNG, JPG or WebP).');
        }
        $name = Str::random(24);
        [$path, $w, $h] = self::save($source, self::FULL, self::DIR . "/{$name}.webp", 82);
        [$thumb] = self::save($source, self::THUMB, self::DIR . "/{$name}-thumb.webp", 76);

        return $trade->images()->create([
            'path' => $path, 'thumb_path' => $thumb, 'width' => $w, 'height' => $h,
            'sort_order' => (int) $trade->images()->max('sort_order') + 1,
        ]);
    }

    /** @return array{0: string, 1: int, 2: int} the path, width, height */
    private static function save(\GdImage $source, int $maxWidth, string $path, int $quality): array
    {
        $w = imagesx($source);
        $h = imagesy($source);
        $scale = min(1, $maxWidth / $w);
        $nw = max(1, (int) round($w * $scale));
        $nh = max(1, (int) round($h * $scale));

        $img = imagecreatetruecolor($nw, $nh);
        imagealphablending($img, false);
        imagesavealpha($img, true);
        imagecopyresampled($img, $source, 0, 0, 0, 0, $nw, $nh, $w, $h);
        ob_start();
        imagewebp($img, null, $quality);
        $bytes = (string) ob_get_clean();

        Storage::disk('public')->put($path, $bytes);

        return [$path, $nw, $nh];
    }
}
