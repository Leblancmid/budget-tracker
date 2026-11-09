<?php

namespace App\Http\Requests\Business;

use App\Services\WebsiteStats;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['status' => ['required', Rule::in(WebsiteStats::LEAD_STATUSES)]];
    }
}
