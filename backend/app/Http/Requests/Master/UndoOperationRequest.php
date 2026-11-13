<?php

namespace App\Http\Requests\Master;

use App\Models\Operation;
use Illuminate\Foundation\Http\FormRequest;

/** Undo or redo: admins can for anything, anyone else only for what they did themselves. */
class UndoOperationRequest extends FormRequest
{
    public function authorize(): bool
    {
        $operation = $this->route('operation');
        $user = $this->user();

        return $user !== null && $operation instanceof Operation && ($user->isAdmin() || $operation->user_id === $user->id);
    }

    public function rules(): array
    {
        return [];
    }
}
