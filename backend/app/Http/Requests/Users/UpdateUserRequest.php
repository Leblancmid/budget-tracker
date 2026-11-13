<?php

namespace App\Http\Requests\Users;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * An admin edits a user's name, email, role or modules. Partial: send only what changed. Nobody
 * changes their own access, so there is always at least one admin left.
 */
class UpdateUserRequest extends FormRequest
{
    use NormalizesUserInput;

    public function authorize(): bool
    {
        $target = $this->route('user');
        if (! $this->user()?->isAdmin() || ! $target instanceof User) {
            return false;
        }

        // Your own access (role or modules) is changed by another admin, never by you
        $self = $target->id === $this->user()->id;
        $changesOwnAccess = $self && (($this->has('role') && $this->input('role') !== $target->role) || $this->has('modules'));

        return ! $changesOwnAccess;
    }

    public function rules(): array
    {
        return [
            'name'  => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('user')->id)],
            'role'  => ['sometimes', 'required', Rule::in(User::ROLES)],
            'modules'   => ['sometimes', 'nullable', 'array'],
            'modules.*' => ['string', Rule::in(User::MODULES)],
        ];
    }
}
