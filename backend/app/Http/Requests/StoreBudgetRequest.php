<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'required',
                'exists:categories,id',
                Rule::unique('budgets')->where(fn ($q) => $q
                    ->where('month', $this->month)
                    ->where('year', $this->year)
                ),
            ],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'month'  => ['required', 'integer', 'min:1', 'max:12'],
            'year'   => ['required', 'integer', 'min:2000', 'max:2100'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.unique' => 'A budget for this category already exists for the selected month and year.',
        ];
    }
}
