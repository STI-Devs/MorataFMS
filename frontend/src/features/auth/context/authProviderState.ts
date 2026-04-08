import { isAxiosError } from '../../../lib/apiErrors';
import { authApi, InvalidCurrentUserPayloadError } from '../api/authApi';
import type { User } from '../types/auth.types';

let restoreSessionPromise: Promise<User | null> | null = null;

export function syncRestoreSessionPromise(user: User | null): void {
    restoreSessionPromise = Promise.resolve(user);
}

export function restoreSession(): Promise<User | null> {
    if (!restoreSessionPromise) {
        restoreSessionPromise = authApi.getCurrentUser()
            .then((user) => {
                syncRestoreSessionPromise(user);

                return user;
            })
            .catch((error: unknown) => {
                if (
                    error instanceof InvalidCurrentUserPayloadError
                    || (error instanceof Error && error.name === 'InvalidCurrentUserPayloadError')
                    || (isAxiosError(error) && [401, 419].includes(error.response?.status ?? 0))
                ) {
                    syncRestoreSessionPromise(null);

                    return null;
                }

                restoreSessionPromise = null;
                throw error;
            });
    }

    return restoreSessionPromise;
}

export function resetAuthProviderStateForTests(): void {
    restoreSessionPromise = null;
}
