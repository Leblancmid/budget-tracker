<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\UpdateLeadRequest;
use App\Services\WebsiteStats;
use Illuminate\Http\JsonResponse;
use RuntimeException;

/** Leads from the website, kept on the website's database; this app reads and updates them. */
class LeadController extends Controller
{
    public function index(): JsonResponse
    {
        if (! WebsiteStats::configured()) {
            return response()->json(['configured' => false, 'leads' => []]);
        }
        try {
            return response()->json(['configured' => true, 'leads' => WebsiteStats::leads()]);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
    }

    public function update(UpdateLeadRequest $request, int $lead): JsonResponse
    {
        try {
            WebsiteStats::updateLead($lead, $request->validated('status'));
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json(['message' => 'Updated.']);
    }
}
