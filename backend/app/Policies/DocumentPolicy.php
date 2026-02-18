<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Determine if the user can view any documents.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can list documents
        return true;
    }

    /**
     * Determine if the user can view the document.
     */
    public function view(User $user, Document $document): bool
    {
        // All authenticated users can view/download documents
        return true;
    }

    /**
     * Determine if the user can create documents.
     */
    public function create(User $user): bool
    {
        // Encoder and above can upload documents
        return $user->hasRoleAtLeast('encoder');
    }

    /**
     * Determine if the user can delete the document.
     */
    public function delete(User $user, Document $document): bool
    {
        // Supervisor+ can delete any document, or the uploader can delete their own
        return $user->isSupervisorOrAbove() || $document->uploaded_by === $user->id;
    }
}
