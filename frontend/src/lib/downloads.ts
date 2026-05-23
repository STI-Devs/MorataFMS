import api from './axios';

export const buildApiDownloadUrl = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = api.defaults.baseURL;

    if (!baseUrl) {
        return normalizedPath;
    }

    if (/^https?:\/\//i.test(baseUrl)) {
        return new URL(normalizedPath, baseUrl).toString();
    }

    return `${baseUrl.replace(/\/$/, '')}${normalizedPath}`;
};

export const startBrowserDownload = (url: string): void => {
    const link = document.createElement('a');
    link.href = url;
    link.rel = 'noopener';
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    link.remove();
};

export const startApiDownload = (path: string): void => {
    startBrowserDownload(buildApiDownloadUrl(path));
};
