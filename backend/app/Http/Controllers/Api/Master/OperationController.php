<?php

namespace App\Http\Controllers\Api\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\UndoOperationRequest;
use App\Models\ActivityLog;
use App\Models\Operation;
use App\Models\OperationChange;
use App\Services\Undo\OperationLabel;
use App\Services\Undo\OperationUndo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * Master File → Undo: everything done in the app, newest first, each one undoable. Admins see and
 * undo everyone's actions; anyone else only their own.
 */
class OperationController extends Controller
{
    private const PER_PAGE = 15;

    /** Fields that change on every save and say nothing about what was done. */
    private const NOISE = ['updated_at', 'created_at'];

    public function index(Request $request): JsonResponse
    {
        // Admins see everyone's; anyone else only what they did
        $me = $request->user();
        $page = Operation::where('kind', 'action')->with(['user:id,name', 'changes'])
            ->when(! $me->isAdmin(), fn ($q) => $q->where('user_id', $me->id))
            ->latest('id')->paginate(self::PER_PAGE);

        $undoers = Operation::whereIn('id', $page->getCollection()->pluck('undone_by_id')->filter())->with('user:id,name')->get()->keyBy('id');

        $page->getCollection()->transform(fn (Operation $op) => [
            'id'         => $op->id,
            'label'      => $op->label,
            'user'       => $op->user?->name ?? 'Scheduler',
            'created_at' => $op->created_at->toIso8601String(),
            'undone_at'  => $op->undone_at?->toIso8601String(),
            'undone_by'  => $op->undone_by_id ? ($undoers[$op->undone_by_id]?->user?->name ?? 'Someone') : null,
            'changes'    => $op->changes->sortBy('id')->values()->map(fn (OperationChange $c) => $this->describe($c))->all(),
        ]);

        return response()->json($page);
    }

    public function undo(UndoOperationRequest $request, Operation $operation): JsonResponse
    {
        try {
            OperationUndo::undo($operation, $request->user()->id);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
        ActivityLog::note('system', 'undone', 'Undid: ' . $operation->label, $operation);

        return response()->json(['message' => 'Undone: ' . $operation->label . '.']);
    }

    /** Do an undone operation again (by undoing its undo). */
    public function redo(UndoOperationRequest $request, Operation $operation): JsonResponse
    {
        $undo = $operation->undone_by_id ? Operation::find($operation->undone_by_id) : null;
        if (! $undo) {
            return response()->json(['message' => 'This hasn\'t been undone.'], 409);
        }
        try {
            OperationUndo::undo($undo, $request->user()->id);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 409);
        }
        ActivityLog::note('system', 'redone', 'Redid: ' . $operation->label, $operation);

        return response()->json(['message' => 'Done again: ' . $operation->label . '.']);
    }

    /** One changed row, for people: "sale “Leblanc 700 Dist” changed: archived_at — → Nov 10". */
    private function describe(OperationChange $c): array
    {
        $fields = [];
        if ($c->action === 'updated') {
            foreach ($c->after ?? [] as $k => $v) {
                $old = $c->before[$k] ?? null;
                if (! in_array($k, self::NOISE, true) && (string) $old !== (string) $v) {
                    $fields[] = ['field' => $k, 'before' => self::short($old), 'after' => self::short($v)];
                }
            }
        }

        return [
            'table'  => $c->table_name,
            'noun'   => OperationLabel::NOUNS[$c->table_name] ?? str_replace('_', ' ', $c->table_name),
            'action' => $c->action,
            'name'   => OperationLabel::nameOf($c->after ?? $c->before),
            'amount' => self::short(($c->after ?? $c->before)['amount'] ?? null),
            'fields' => array_slice($fields, 0, 6),
        ];
    }

    private static function short(mixed $v): ?string
    {
        if ($v === null) {
            return null;
        }
        $s = (string) $v;
        // 1500.00 → 1500, 3600000000.00 → 3600000000
        if (is_numeric($s) && str_contains($s, '.')) {
            $s = rtrim(rtrim($s, '0'), '.');
        }

        return mb_strimwidth($s, 0, 40, '…');
    }
}
