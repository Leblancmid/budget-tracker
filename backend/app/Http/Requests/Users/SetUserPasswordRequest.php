<?php

namespace App\Http\Requests\Users;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/** An admin sets a new password for someone else (your own is changed from your profile). */
class SetUserPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return (bool) $this->user()?->isAdmin() && $target instanceof User && $target->id !== $this->user()->id;
    }

    public function rules(): array
    {
        return ['password' => ['required', 'string', Password::defaults()]];
    }
}
