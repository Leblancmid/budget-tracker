<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

/** Changing your own password needs the current one. */
class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string'],
            'password'         => ['required', 'string', 'confirmed', 'different:current_password', Password::defaults()],
        ];
    }

    public function messages(): array
    {
        return ['password.different' => 'The new password must be different from the current one.'];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $current = (string) $this->input('current_password');
                if (! $validator->errors()->has('current_password') && ! Hash::check($current, $this->user()->password)) {
                    $validator->errors()->add('current_password', "That isn't your current password.");
                }
            },
        ];
    }
}
