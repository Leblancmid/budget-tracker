<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

/**
 * The Listing Kit image (drawn in the app) and its caption, for your Discord listings channel.
 * Optional on Publish, required on "Post to Discord". The uploaded file's name is never used.
 */
class ListingImageRequest extends FormRequest
{
    /** Discord's upload limit for a webhook message */
    public const MAX_KB = 10 * 1024;

    public function authorize(): bool
    {
        return true; // the routes already need the Storefront
    }

    public function rules(): array
    {
        $required = $this->routeIs('business.listing.discord') ? 'required' : 'nullable';

        return [
            'image'   => [$required, 'file', 'mimes:png,jpg,jpeg', 'mimetypes:image/png,image/jpeg', 'max:' . self::MAX_KB],
            'caption' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /** @return array{contents: string, name: string, caption: string}|null */
    public function kitImage(): ?array
    {
        $file = $this->file('image');
        if (! $file instanceof UploadedFile) {
            return null;
        }

        return [
            'contents' => (string) $file->get(),
            'name'     => 'Leblanc.' . ($file->getMimeType() === 'image/jpeg' ? 'jpg' : 'png'),
            'caption'  => (string) $this->validated('caption', ''),
        ];
    }
}
