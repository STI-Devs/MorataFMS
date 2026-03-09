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

/**
 * Extracts the first usable error string from a Laravel response.
 * Priority: field validation errors → top-level message → null.
 */
function extractServerMessage(err: AxiosLikeError): string | null {
    const data = err.response?.data;
    if (!data) return null;

    // Laravel validation errors: { errors: { email: ['msg1', 'msg2'] } }
    if (data.errors) {
        const first = Object.values(data.errors).flat()[0];
        if (first) return first;
    }

    // Top-level message: { message: 'Your account has been deactivated...' }
    if (data.message) return data.message;

    return null;
}

/**
 * Friendly status-code fallback messages.
 * Used ONLY when the server doesn't provide a human-readable message.
 */
function statusFallback(status: number | undefined, action: string): string {
    switch (status) {
        case 400: return 'Bad request. Please check your input and try again.';
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

/**
 * General-purpose error handler for any authenticated in-app action.
 * Always prefers the real server message; falls back to status-based text.
 */
export function getApiError(err: unknown, action = 'complete the action'): string {
    if (isAxiosError(err)) {
        const serverMsg = extractServerMessage(err);
        if (serverMsg) return serverMsg;
        return statusFallback(err.response?.status, action);
    }
    return `Failed to ${action}. An unexpected error occurred.`;
}

/**
 * Error handler for the Login form.
 * Always surfaces the real server message; uses login-specific fallbacks.
 */
export function getLoginError(err: unknown): string {
    if (isAxiosError(err)) {
        const serverMsg = extractServerMessage(err);
        if (serverMsg) return serverMsg;

        // Login-specific fallbacks when the server sends no message body.
        const status = err.response?.status;
        if (status === 401 || status === 422) return 'Invalid email or password. Please try again.';
    }
    return getApiError(err, 'log in');
}

/**
 * Error handler for the Registration form.
 * Always surfaces the real server message; uses registration-specific fallbacks.
 */
export function getRegisterError(err: unknown): string {
    if (isAxiosError(err)) {
        const serverMsg = extractServerMessage(err);
        if (serverMsg) return serverMsg;

        if (err.response?.status === 409) return 'An account with this email already exists.';
    }
    return getApiError(err, 'create account');
}
