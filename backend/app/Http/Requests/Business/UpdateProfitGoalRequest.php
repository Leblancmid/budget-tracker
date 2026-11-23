<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

/** The monthly profit goal (₱): empty removes it. */
class UpdateProfitGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // the route already needs Trading
    }

    public function rules(): array
    {
        return ['goal_php' => ['present', 'nullable', 'numeric', 'min:1', 'max:100000000']];
    }

    public function messages(): array
    {
        return ['goal_php.min' => 'Set a goal above ₱0, or clear it to remove the goal.'];
    }
}
