export type AxiosLikeError = {
    response?: {
        status?: number;
        data?: {
            message?: string;
            errors?: Record<string, string[]>;
        };
    };
};

export function isAxiosError(err: unknown): err is AxiosLikeError {
    return typeof err === 'object' && err !== null && 'response' in err;
}

// ─── General ──────────────────────────────────────────────────────────────────

/**
 * General-purpose error sanitizer for any authenticated in-app action.
 * Surfaces safe Laravel validation errors; maps all other statuses to friendly messages.
 *
 * @param err    - The caught error from a try/catch block
 * @param action - Short description e.g. 'save user', 'reassign encoder'
 */
export function getApiError(err: unknown, action = 'complete the action'): string {
    if (isAxiosError(err)) {
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
            return Object.values(validationErrors).flat()[0] ?? 'Please check the form and try again.';
        }

        switch (err.response?.status) {
            case 400: return `Bad request. Please check your input and try again.`;
            case 401: return 'Your session has expired. Please log in again.';
            case 403: return 'You do not have permission to do that.';
            case 404: return 'The requested record could not be found.';
            case 409: return 'This record already exists or conflicts with another.';
            case 422: return 'Please check the form and try again.';
            case 429: return 'Too many requests. Please wait a moment and try again.';
            case 500: return 'Something went wrong on our end. Please try again.';
            case 502:
            case 504: return 'The server is not responding. Please try again shortly.';
            case 503: return 'The service is temporarily unavailable. Please try again later.';
            default: return `Failed to ${action}. Please check your connection and try again.`;
        }
    }
    return `Failed to ${action}. An unexpected error occurred.`;
}

// ─── Auth forms ───────────────────────────────────────────────────────────────
// These only override status codes that have a different meaning in an auth context.
// Everything else falls through to getApiError.

/**
 * Error messages for the Login form.
 * Only 401 and 422 have login-specific meanings; all others delegate to getApiError.
 */
export function getLoginError(err: unknown): string {
    if (isAxiosError(err)) {
        switch (err.response?.status) {
            case 401: return 'Invalid email or password. Please try again.';
            case 422: return 'Please check your email and password.';
        }
    }
    return getApiError(err, 'log in');
}

/**
 * Error messages for the Registration form.
 * Surfaces validation field errors and overrides 409 with a registration-specific message.
 * Everything else delegates to getApiError.
 */
export function getRegisterError(err: unknown): string {
    if (isAxiosError(err)) {
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
            return Object.values(validationErrors).flat()[0] ?? 'Please check the form and try again.';
        }

        if (err.response?.status === 409) {
            return 'An account with this email already exists.';
        }
    }
    return getApiError(err, 'create account');
}
