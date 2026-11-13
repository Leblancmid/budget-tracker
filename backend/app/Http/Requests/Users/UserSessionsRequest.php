<?php

namespace App\Http\Requests\Users;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/** An admin signs someone else's devices out (your own are on your profile). */
class UserSessionsRequest extends FormRequest
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
