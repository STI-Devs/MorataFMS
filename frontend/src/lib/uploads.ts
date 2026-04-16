export const MAX_MULTI_UPLOAD_FILES = 10;
export const MAX_UPLOAD_FILE_SIZE_MB = 20;
export const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024;

export function getMaxFilesErrorMessage(limit = MAX_MULTI_UPLOAD_FILES): string {
    return `You can upload up to ${limit} files at a time.`;
}

export function getMaxFileSizeErrorMessage(limitMb = MAX_UPLOAD_FILE_SIZE_MB): string {
    return `Each file must be ${limitMb}MB or less.`;
}
