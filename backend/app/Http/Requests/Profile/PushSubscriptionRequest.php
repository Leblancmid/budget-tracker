<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

/** A device's push subscription, as the browser gives it (endpoint + keys). */
class PushSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            // Only real push services (https), never an address on this network
            'endpoint'    => ['required', 'string', 'max:1000', 'url:https'],
            'keys.p256dh' => ['required_with:keys', 'string', 'max:200'],
            'keys.auth'   => ['required_with:keys', 'string', 'max:100'],
        ];
    }
}
