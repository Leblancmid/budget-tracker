<?php

namespace App\Http\Requests\Users;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/** Turning an account off or back on: admins only, and never your own account. */
class ChangeUserStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return (bool) $this->user()?->isAdmin() && $target instanceof User && $target->id !== $this->user()->id;
    }

    public function rules(): array
    {
        return [];
    }
}
