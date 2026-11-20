<?php

namespace App\Http\Requests\Business;

use Illuminate\Validation\Rule;

/**
 * Switch Discord auto-post on or off. Switching it on sends the Listing Kit image it will post.
 */
class DiscordAutoPostRequest extends ListingImageRequest
{
    public function rules(): array
    {
        return [
            'enabled' => ['required', 'boolean'],
            'image'   => [Rule::requiredIf(fn () => $this->boolean('enabled')), 'nullable', 'file', 'mimes:png,jpg,jpeg', 'mimetypes:image/png,image/jpeg', 'max:' . self::MAX_KB],
            'caption' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return ['image.required' => 'The Listing Kit image is empty: add an account to it first.'];
    }
}
