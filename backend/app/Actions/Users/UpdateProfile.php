<?php

namespace App\Actions\Users;

use App\Models\User;
use Illuminate\Auth\SessionGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UpdateProfile
{
    public function handle(User $user, array $validated, ?string $currentSessionId = null): User
    {
        if (! empty($validated['name'])) {
            $user->name = $validated['name'];
        }

        if (array_key_exists('job_title', $validated)) {
            $user->job_title = filled($validated['job_title']) ? trim((string) $validated['job_title']) : null;
        }

        if (! empty($validated['password'])) {
            /** @var SessionGuard $webGuard */
            $webGuard = Auth::guard('web');
            $webGuard->logoutOtherDevices($validated['current_password']);

            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        if (! empty($validated['password']) && config('session.driver') === 'database') {
            DB::table((string) config('session.table', 'sessions'))
                ->where('user_id', $user->getKey())
                ->when(
                    $currentSessionId !== null,
                    fn ($query) => $query->where('id', '!=', $currentSessionId),
                )
                ->delete();
        }

        return $user;
    }
}
