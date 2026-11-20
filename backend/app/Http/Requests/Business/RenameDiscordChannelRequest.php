<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

/** Your name for a Discord channel on the Discord page (empty: back to the default). */
class RenameDiscordChannelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the route already needs the Storefront
    }

    public function rules(): array
    {
        return ['name' => ['present', 'nullable', 'string', 'max:40']];
    }
}
