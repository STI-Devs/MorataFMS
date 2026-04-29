export function getUploadErrorMessage(error: unknown): string {
    const responseData = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
    const validationMessage = responseData?.errors
        ? Object.values(responseData.errors).flat().find((message) => typeof message === 'string' && message.trim().length > 0)
        : null;

    return validationMessage
        ?? responseData?.message
        ?? (error instanceof Error ? error.message : null)
        ?? 'Upload failed. Please try again.';
}

export function withUploadErrorMessage(error: unknown, message: string): Error {
    if (error && typeof error === 'object') {
        const errorRecord = error as {
            message?: string;
            response?: {
                data?: {
                    message?: string;
                };
            };
        };

        errorRecord.message = message;
        errorRecord.response ??= {};
        errorRecord.response.data ??= {};
        errorRecord.response.data.message = message;

        return error as Error;
    }

    return new Error(message);
}
