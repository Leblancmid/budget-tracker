<?php

namespace App\Http\Requests\Users;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** An admin adds a user and gives them a first password to sign in with. */
class StoreUserRequest extends FormRequest
{
    use NormalizesUserInput;

    public function authorize(): bool
    {
        return (bool) $this->user()?->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'role'     => ['required', Rule::in(User::ROLES)],
            'password' => ['required', 'string', Password::defaults()],
        ];
    }
}
