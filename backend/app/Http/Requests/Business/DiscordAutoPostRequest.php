<?php

namespace App\Http\Requests\Business;

/**
 * Switch Discord auto-post on or off. From the Listing Kit, switching on sends the image as drawn;
 * from the Discord page it sends none and the saved picture is used (the controller checks there is one).
 */
class DiscordAutoPostRequest extends ListingImageRequest
{
    public function rules(): array
    {
        return [
            'enabled' => ['required', 'boolean'],
            'image'   => ['nullable', 'file', 'mimes:png,jpg,jpeg', 'mimetypes:image/png,image/jpeg', 'max:' . self::MAX_KB],
            'caption' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
