type AxiosLikeError = {
    response?: {
        status?: number;
        data?: {
            message?: string;
            errors?: Record<string, string[]>;
        };
    };
};

function isAxiosError(err: unknown): err is AxiosLikeError {
    return typeof err === 'object' && err !== null && 'response' in err;
}

export function getLoginError(err: unknown): string {
    if (isAxiosError(err)) {
        switch (err.response?.status) {
            case 401: return 'Invalid email or password. Please try again.';
            case 422: return 'Please check your email and password.';
            case 429: return 'Too many attempts. Please wait a moment and try again.';
            case 500:
            case 503: return 'Service is temporarily unavailable. Please try again later.';
            default: return 'Login failed. Please check your connection and try again.';
        }
    }
    return 'An unexpected error occurred. Please try again.';
}

export function getRegisterError(err: unknown): string {
    if (isAxiosError(err)) {
        // Surface Laravel validation errors — these are safe field-level messages
        const validationErrors = err.response?.data?.errors;
        if (validationErrors) {
            return Object.values(validationErrors).flat()[0] ?? 'Please check the form and try again.';
        }

        switch (err.response?.status) {
            case 409: return 'An account with this email already exists.';
            case 422: return 'Please check the form and try again.';
            case 429: return 'Too many attempts. Please wait a moment and try again.';
            case 500:
            case 503: return 'Service is temporarily unavailable. Please try again later.';
            default: return 'Registration failed. Please check your connection and try again.';
        }
    }
    return 'An unexpected error occurred. Please try again.';
}
