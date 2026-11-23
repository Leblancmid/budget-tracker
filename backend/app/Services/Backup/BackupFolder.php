<?php

namespace App\Services\Backup;

use Illuminate\Support\Facades\File;
use RuntimeException;

/**
 * A folder off this PC's own disk for the encrypted backups: a Google Drive (or OneDrive) folder
 * that the Drive app syncs to the cloud (BACKUP_FOLDER). Database backups go in "database",
 * uploaded files (screenshots, profile pictures) in "files".
 *
 * The scheduler runs as Windows' SYSTEM account, which can't see Google Drive's G: drive (that's
 * per user). Drive's "Mirror files" mode keeps a real folder (C:\Users\<you>\My Drive), which works.
 */
class BackupFolder
{
    public const DATABASE = 'database';

    public const FILES = 'files';

    public static function configured(): bool
    {
        return trim((string) config('backup.folder')) !== '';
    }

    /** The folder for one kind of backup, made if it isn't there yet. */
    public static function path(string $kind): string
    {
        $root = rtrim(trim((string) config('backup.folder')), '\\/');
        if ($root === '' || ! File::isDirectory($root)) {
            throw new RuntimeException("The backup folder \"{$root}\" can't be reached. Is Google Drive running and signed in on this PC? "
                . 'The scheduler runs as SYSTEM, which can\'t see Drive\'s G: drive: set Google Drive to "Mirror files" and use its '
                . 'C:\\Users\\<you>\\My Drive folder instead.');
        }
        $dir = $root . DIRECTORY_SEPARATOR . $kind;
        File::ensureDirectoryExists($dir);
        if (! is_writable($dir)) {
            throw new RuntimeException("Can't write to the backup folder \"{$dir}\".");
        }

        return $dir;
    }

    /** Save a backup, then keep only the newest $keep of that kind. Returns its full path. */
    public static function put(string $kind, string $name, string $data, int $keep): string
    {
        $dir  = self::path($kind);
        $file = $dir . DIRECTORY_SEPARATOR . basename($name);
        // Write next to it, then rename: Drive never syncs a half-written file
        File::put($file . '.part', $data);
        File::move($file . '.part', $file);

        foreach (array_slice(self::list($kind), 0, max(0, count(self::list($kind)) - $keep)) as $old) {
            File::delete($dir . DIRECTORY_SEPARATOR . $old);
        }

        return $file;
    }

    /**
     * The backups of one kind, oldest first (names start with the date, so they sort by it).
     *
     * @return list<string> file names
     */
    public static function list(string $kind): array
    {
        $dir = self::path($kind);

        return collect(File::files($dir))
            ->map(fn ($f) => $f->getFilename())
            ->filter(fn ($n) => str_ends_with($n, '.enc'))
            ->sort()
            ->values()
            ->all();
    }

    public static function get(string $kind, string $name): string
    {
        return File::get(self::path($kind) . DIRECTORY_SEPARATOR . basename($name));
    }
}
