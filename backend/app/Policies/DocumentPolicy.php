<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Document;
use App\Models\ExportTransaction;
use App\Models\ImportTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class DocumentPolicy
{
    /**
     * Determine if the user can view any documents.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasBrokerageAccess();
    }

    /**
     * Determine if the user can view the document.
     */
    public function view(User $user, Document $document): bool
    {
        return $this->canAccessTransactionDocument($user, $document->documentable, $document);
    }

    /**
     * Determine if the user can create documents.
     */
    public function create(User $user, ImportTransaction|ExportTransaction|null $documentable = null): bool
    {
        if (! $user->hasBrokerageAccess()) {
            return false;
        }

        if ($documentable === null) {
            return true;
        }

        return $this->canAccessTransactionDocument($user, $documentable);
    }

    /**
     * Determine if the user can delete the document.
     */
    public function delete(User $user, Document $document): bool
    {
        return $user->isAdmin()
            || ($document->uploaded_by === $user->id && $this->canAccessTransactionDocument($user, $document->documentable, $document));
    }

    private function canAccessTransactionDocument(
        User $user,
        ImportTransaction|ExportTransaction|Model|null $documentable,
        ?Document $document = null,
    ): bool {
        if (! $documentable instanceof ImportTransaction && ! $documentable instanceof ExportTransaction) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if (! $user->hasBrokerageAccess()) {
            return false;
        }

        if ($user->role === UserRole::Encoder) {
            return $documentable->assigned_user_id === $user->id;
        }

        if (in_array($user->role, [UserRole::Processor, UserRole::Accounting], true)) {
            if ($document?->uploaded_by === $user->id) {
                return true;
            }

            return $documentable->isRelevantToOperationalQueue($user);
        }

        return false;
    }
}
