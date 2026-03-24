<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $validRoles = array_map(
            static fn (UserRole $role): string => $role->value,
            UserRole::cases(),
        );

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'lowercase', 'email', 'max:255', Rule::unique('users')->ignore($this->route('user'))],
            'job_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'password' => ['sometimes', 'confirmed', Rules\Password::defaults()],
            'role' => ['sometimes', 'string', Rule::in($validRoles)],
        ];
    }
}
