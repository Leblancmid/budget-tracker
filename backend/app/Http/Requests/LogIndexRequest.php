<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** The Logs page: how far back to look (days; 0 = everything). Access is checked by the route. */
class LogIndexRequest extends FormRequest
{
    public const PERIODS = [30, 90, 365, 0];

    public const DEFAULT_DAYS = 90;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return ['days' => ['sometimes', 'integer', Rule::in(self::PERIODS)]];
    }

    public function days(): int
    {
        return (int) ($this->validated('days') ?? self::DEFAULT_DAYS);
    }
}
