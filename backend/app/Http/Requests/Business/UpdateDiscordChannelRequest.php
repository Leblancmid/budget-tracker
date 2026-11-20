<?php

namespace App\Http\Requests\Business;

use App\Services\ListingAnnouncer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A Discord channel's settings on the Discord page, any of: your name for it (empty: back to the
 * default), when it gets auto-posts, and whether a new post replaces your previous one there.
 */
class UpdateDiscordChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the route already needs the Storefront
    }

    public function rules(): array
    {
        return [
            'name'     => ['sometimes', 'nullable', 'string', 'max:40'],
            'schedule' => ['sometimes', Rule::in(ListingAnnouncer::SCHEDULES)],
            'replace'  => ['sometimes', 'boolean'],
        ];
    }
}
