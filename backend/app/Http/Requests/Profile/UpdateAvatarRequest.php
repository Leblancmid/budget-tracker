<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

/** A new profile picture: an actual image, at most 2 MB. The uploaded file name is never used. */
class UpdateAvatarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'avatar' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048', 'dimensions:min_width=64,min_height=64,max_width=4096,max_height=4096'],
        ];
    }

    public function messages(): array
    {
        return [
            'avatar.max'        => 'The picture must be 2 MB or smaller.',
            'avatar.mimes'      => 'Use a JPG, PNG or WebP picture.',
            'avatar.image'      => 'Use a JPG, PNG or WebP picture.',
            'avatar.dimensions' => 'The picture must be between 64 and 4096 pixels on each side.',
        ];
    }
}
