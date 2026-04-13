export const MAX_MULTI_UPLOAD_FILES = 10;

export function getMaxFilesErrorMessage(limit = MAX_MULTI_UPLOAD_FILES): string {
    return `You can upload up to ${limit} files at a time.`;
}
