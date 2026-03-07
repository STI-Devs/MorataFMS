<?php

namespace App\Policies;

use App\Models\NotarialBook;
use App\Models\User;

class NotarialBookPolicy
{
    /**
     * Legal staff (paralegal+) or admin can view books.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasLegalAccess();
    }

    /**
     * View a single book — same as viewAny.
     */
    public function view(User $user, NotarialBook $book): bool
    {
        return $user->hasLegalAccess();
    }

    /**
     * Only lawyer or admin can create new books.
     */
    public function create(User $user): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('lawyer');
    }

    /**
     * Only lawyer or admin can update books (e.g., archive).
     */
    public function update(User $user, NotarialBook $book): bool
    {
        return $user->hasLegalAccess()
            && $user->hasRoleAtLeast('lawyer');
    }

    /**
     * Only admin can delete books.
     */
    public function delete(User $user, NotarialBook $book): bool
    {
        return $user->isAdmin();
    }
}
