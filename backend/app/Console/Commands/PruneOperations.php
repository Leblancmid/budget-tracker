<?php

namespace App\Console\Commands;

use App\Models\Operation;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Keep the undo history for OPERATIONS_KEEP_DAYS (90), then forget it. Also removes uploaded
 * account images nothing uses any more (no account, and no remaining history that could bring
 * one back), once they're older than that too.
 */
class PruneOperations extends Command
{
    public const KEEP_DAYS = 90;

    /** Folders on the public disk that hold account images. */
    private const IMAGE_DIRS = ['screenshots', 'avatars'];

    protected $signature = 'operations:prune';

    protected $description = 'Forget undo history older than 90 days, and account images nothing uses any more';

    public function handle(): int
    {
        $cutoff = now()->subDays(self::KEEP_DAYS);
        $ops = Operation::where('created_at', '<', $cutoff)->count();
        // Undo entries point at what they reverted: clear those links first
        Operation::where('created_at', '<', $cutoff)->update(['reverts_id' => null, 'undone_by_id' => null]);
        Operation::where('created_at', '<', $cutoff)->delete(); // changes go with them (cascade)

        $used = $this->imagesInUse();
        $removed = 0;
        $disk = Storage::disk('public');
        foreach (self::IMAGE_DIRS as $dir) {
            foreach ($disk->files($dir) as $file) {
                if (! isset($used[$file]) && $disk->lastModified($file) < $cutoff->getTimestamp()) {
                    $disk->delete($file);
                    $removed++;
                }
            }
        }

        $this->info("Forgot {$ops} operation(s) older than " . self::KEEP_DAYS . " days; removed {$removed} unused image(s).");

        return self::SUCCESS;
    }

    /** Image paths an account uses now, or that remaining undo history could restore. */
    private function imagesInUse(): array
    {
        $used = [];
        foreach (DB::table('rucoy_accounts')->get(['avatar', 'screenshot']) as $a) {
            foreach ([$a->avatar, $a->screenshot] as $p) {
                if ($p) {
                    $used[$p] = true;
                }
            }
        }
        $history = DB::table('operation_changes')->where('table_name', 'rucoy_accounts')->get(['before', 'after']);
        foreach ($history as $c) {
            foreach ([$c->before, $c->after] as $json) {
                $row = $json ? json_decode($json, true) : null;
                foreach (['avatar', 'screenshot'] as $k) {
                    if (! empty($row[$k])) {
                        $used[$row[$k]] = true;
                    }
                }
            }
        }

        return $used;
    }
}
