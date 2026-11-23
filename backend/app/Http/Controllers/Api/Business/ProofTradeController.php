<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\AddProofImagesRequest;
use App\Http\Requests\Business\StoreProofTradeRequest;
use App\Http\Requests\Business\UpdateProofTradeRequest;
use App\Models\ActivityLog;
use App\Models\ProofImage;
use App\Models\ProofTrade;
use App\Services\ProofImages;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Proven trades: your best trades with their screenshots, for the website's showcase. They go live
 * with "Publish to website".
 */
class ProofTradeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ProofTrade::with('images')->orderByDesc('value')->orderByDesc('id')->get());
    }

    public function store(StoreProofTradeRequest $request): JsonResponse
    {
        $data  = $request->safe()->except('images');
        $files = array_values($request->file('images', []));
        try {
            ProofImages::check($files);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => ['images' => [$e->getMessage()]]], 422);
        }
        $trade = DB::transaction(function () use ($data, $files) {
            $trade = ProofTrade::create($data);
            foreach ($files as $file) {
                ProofImages::add($trade, $file);
            }

            return $trade;
        });
        ActivityLog::note('business', 'created', "Proven trade added: {$trade->title}", $trade);

        return response()->json($trade->load('images'), 201);
    }

    public function update(UpdateProofTradeRequest $request, ProofTrade $proofTrade): JsonResponse
    {
        $before = $proofTrade->only(array_keys($request->validated()));
        $proofTrade->update($request->validated());
        $changed = collect($proofTrade->only(array_keys($before)))->filter(fn ($v, $k) => $v != $before[$k]);
        if ($changed->isNotEmpty()) {
            ActivityLog::note('business', 'updated', "Proven trade {$proofTrade->title}: " . $changed->keys()->join(', ') . ' changed', $proofTrade);
        }

        return response()->json($proofTrade->load('images'));
    }

    public function destroy(ProofTrade $proofTrade): JsonResponse
    {
        // One by one, so each image's files go too
        $proofTrade->images->each->delete();
        $proofTrade->delete();
        ActivityLog::note('business', 'deleted', "Proven trade removed: {$proofTrade->title}");

        return response()->json(['message' => 'Removed. Publish to take it off the website.']);
    }

    public function addImages(AddProofImagesRequest $request, ProofTrade $proofTrade): JsonResponse
    {
        $files = array_values($request->file('images'));
        try {
            ProofImages::check($files);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => ['images' => [$e->getMessage()]]], 422);
        }
        foreach ($files as $file) {
            ProofImages::add($proofTrade, $file);
        }

        return response()->json($proofTrade->load('images'));
    }

    /** Make this screenshot the first one (the cover on the website). */
    public function cover(ProofImage $proofImage): JsonResponse
    {
        $trade = $proofImage->trade;
        $proofImage->update(['sort_order' => (int) $trade->images()->min('sort_order') - 1]);

        return response()->json($trade->load('images'));
    }

    public function destroyImage(ProofImage $proofImage): JsonResponse
    {
        $trade = $proofImage->trade;
        $proofImage->delete();

        return response()->json($trade->load('images'));
    }
}
