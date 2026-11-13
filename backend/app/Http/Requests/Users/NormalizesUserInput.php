<?php

namespace App\Http\Requests\Users;

/** Trims the name, and trims and lower-cases the email, when they're sent. */
trait NormalizesUserInput
{
    protected function prepareForValidation(): void
    {
        $clean = [];
        if (is_string($this->input('name'))) {
            $clean['name'] = trim($this->input('name'));
        }
        if (is_string($this->input('email'))) {
            $clean['email'] = mb_strtolower(trim($this->input('email')));
        }
        $this->merge($clean);
    }
}
