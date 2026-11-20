<?php

namespace App\Http\Controllers\Api\Business;

use App\Http\Controllers\Controller;
use App\Http\Requests\Business\DiscordAutoPostRequest;
use App\Http\Requests\Business\ListingImageRequest;
use App\Http\Requests\Business\UpdateGoldRatesRequest;
use App\Models\ActivityLog;
use App\Services\DiscordAutoPost;
use App\Services\DiscordPostLog;
use App\Services\ListingAnnouncer;
use App\Services\ListingPerformance;
use App\Services\ListingPublisher;
use App\Services\PriceGuide;
use App\Services\WebsiteContent;
use App\Services\WebsiteStats;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use RuntimeException;

/**
 * Publish the accounts for sale to the Leblanc website (writes, commits and pushes its repo).
 * The commit in that repo is the record of each publish.
 */
class ListingPublishController extends Controller
{
    public function preview(ListingPublisher $publisher): JsonResponse
    {
        // discord: the listings channel is set up (the app then offers "Post to Discord")
        // discord_auto: auto-post every 12 hours (on/off, the saved picture, the next post)
        return response()->json([...$publisher->preview(), 'discord' => ListingAnnouncer::configured(), 'discord_auto' => DiscordAutoPost::status()]);
    }

    /** Website visitors: online now, visits per day, views per listing, "Notify me" requests. */
    public function stats(Request $request): JsonResponse
    {
        if (! WebsiteStats::configured()) {
            return response()->json(['configured' => false]);
        }
        try {
            return response()->json(['configured' => true, ...WebsiteStats::fetch($request->boolean('fresh'))]);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
    }

    /** Post the Listing Kit image to your Discord listings channel now. */
    public function postToDiscord(ListingImageRequest $request): JsonResponse
    {
        if (! ListingAnnouncer::configured()) {
            return response()->json(['message' => "Discord isn't set up: add LISTING_DISCORD_WEBHOOK to the backend .env, then run the after-deploy script."], 422);
        }
        $image = $request->kitImage();
        DiscordAutoPost::remember($image); // the auto-posts use the newest picture
        ['sent' => $sent, 'total' => $total] = ListingAnnouncer::postImage($image['contents'], $image['name']);
        if ($sent === 0) {
            return response()->json(['message' => 'Discord refused the post. Check the webhook links (php artisan listings:discord tests them).'], 502);
        }
        ActivityLog::note('business', 'published', "Posted the listing image to Discord ({$sent} of {$total} channels)");

        return response()->json([
            'message' => $sent === $total ? 'Posted.' : "Posted to {$sent} of {$total} channels: check the others' webhook links.",
            'sent'    => $sent,
            'total'   => $total,
        ]);
    }

    /** Switch Discord auto-post (10 AM and 10 PM) on or off; on saves the image it will post. */
    public function discordAuto(DiscordAutoPostRequest $request): JsonResponse
    {
        $on = $request->boolean('enabled');
        if ($on && ! ListingAnnouncer::configured()) {
            return response()->json(['message' => "Discord isn't set up: add LISTING_DISCORD_WEBHOOK to the backend .env."], 422);
        }
        if ($on) {
            DiscordAutoPost::remember($request->kitImage());
        }
        DiscordAutoPost::setEnabled($on);
        ActivityLog::note('business', 'updated', 'Discord auto-post ' . ($on ? 'on (10 AM and 10 PM)' : 'off'));

        return response()->json(DiscordAutoPost::status());
    }

    /** The Discord page: each server's 10 AM and 10 PM auto-posts over the last week. ?fresh=1 re-asks Discord for the names. */
    public function discordPosts(Request $request): JsonResponse
    {
        return response()->json(DiscordPostLog::page($request->boolean('fresh')));
    }

    /** Send the saved listing picture to one server now (its channel key from the Discord page). */
    public function sendToChannel(string $channel): JsonResponse
    {
        $r = DiscordAutoPost::sendTo($channel);

        return response()->json(['message' => $r['message']], $r['status']);
    }

    /** The saved listing picture (what auto-post and Send post), to show on the Discord page. */
    public function savedImage(): Response
    {
        $image = DiscordAutoPost::savedImage();
        abort_if($image === null, 404);

        return response($image['contents'], 200, [
            'Content-Type'  => str_ends_with($image['name'], '.jpg') ? 'image/jpeg' : 'image/png',
            'Cache-Control' => 'no-store',
        ]);
    }

    /** How each listed account is doing: days listed, views, requests and a verdict. */
    public function performance(): JsonResponse
    {
        return response()->json(ListingPerformance::build());
    }

    /** Gold rates for the website, with your recent sell / buy rates as a guide. */
    public function goldRates(): JsonResponse
    {
        return response()->json(['gold' => WebsiteContent::gold(), 'guide' => PriceGuide::gold()]);
    }

    /** Save the gold rates; they go live on the next "Publish to website". */
    public function updateGoldRates(UpdateGoldRatesRequest $request): JsonResponse
    {
        WebsiteContent::saveGold($request->validated());

        return $this->goldRates();
    }

    /** Remove a buyer's "Notify me" request (bought already, changed their mind, spam). */
    public function deleteAlert(int $alert): JsonResponse
    {
        try {
            WebsiteStats::deleteAlert($alert);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
        ActivityLog::note('business', 'removed', "Removed: website \"Notify me\" request #{$alert}");

        return response()->json(['message' => 'Request removed.']);
    }

    public function publish(ListingImageRequest $request, ListingPublisher $publisher): JsonResponse
    {
        try {
            $kit    = $request->kitImage();
            $result = $publisher->publish($kit);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
        if ($kit !== null) {
            DiscordAutoPost::remember($kit); // what's for sale now: the auto-posts use this picture
        }
        ActivityLog::note('business', 'published', 'Published listings to the website');

        return response()->json($result);
    }
}
