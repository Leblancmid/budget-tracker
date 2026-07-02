<?php

namespace App\Http\Requests\Business;

use Illuminate\Foundation\Http\FormRequest;

class StoreBusinessBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:business_categories,id',
            'amount'      => 'required|numeric|min:0.01',
            'month'       => 'required|integer|between:1,12',
            'year'        => 'required|integer|min:2000|max:2100',
        ];
    }
}
