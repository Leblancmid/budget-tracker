<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Checked against when the email doesn't exist, so a missing account takes as long
     * to reject as a wrong password (no way to tell which emails are registered).
     */
    private const DUMMY_HASH = '$2y$12$U1kzovIGtRYn66rRLoXhH.0y6FxJ3enWRC9ZEa3BNcBXvUpu0n22O';

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
            'remember' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('email'))) {
            $this->merge(['email' => trim($this->input('email'))]);
        }
    }

    /**
     * The user for these credentials. Failed attempts count toward a lockout per email + IP.
     *
     * @throws ValidationException when the credentials are wrong
     * @throws HttpResponseException (429) while locked out
     */
    public function authenticate(): User
    {
        $this->ensureIsNotRateLimited();

        $user  = User::where('email', $this->input('email'))->first();
        $valid = Hash::check($this->input('password'), $user?->password ?? self::DUMMY_HASH);

        if (! $user || ! $valid) {
            RateLimiter::hit($this->throttleKey(), config('auth.login_throttle.decay_seconds'));

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        RateLimiter::clear($this->throttleKey());

        return $user;
    }

    private function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), config('auth.login_throttle.max_attempts'))) {
            return;
        }

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw new HttpResponseException(response()->json([
            'message'     => "Too many login attempts. Try again in {$seconds} seconds.",
            'retry_after' => $seconds,
        ], 429, ['Retry-After' => $seconds]));
    }

    private function throttleKey(): string
    {
        return 'login:' . Str::transliterate(Str::lower((string) $this->input('email')) . '|' . $this->ip());
    }
}
