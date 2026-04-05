const AUTH_TOKEN_STORAGE_KEY = 'moratafms.auth_token';

/**
 * Temporary bearer-token storage for separate Railway frontend/backend deploys.
 * Revert this helper and return to Sanctum cookie auth after a shared custom domain is available.
 */
function canUseSessionStorage(): boolean {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

export function getAuthToken(): string | null {
    if (!canUseSessionStorage()) {
        return null;
    }

    return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
    if (!canUseSessionStorage()) {
        return;
    }

    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken(): void {
    if (!canUseSessionStorage()) {
        return;
    }

    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
