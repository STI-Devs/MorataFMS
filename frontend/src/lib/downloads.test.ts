import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './axios';
import { buildApiDownloadUrl, startBrowserDownload } from './downloads';

describe('download helpers', () => {
    beforeEach(() => {
        api.defaults.baseURL = undefined;
    });

    it('builds same-origin API download URLs when no API base URL is configured', () => {
        expect(buildApiDownloadUrl('/api/archive-zip-exports/zip-1/download'))
            .toBe('/api/archive-zip-exports/zip-1/download');
    });

    it('builds absolute API download URLs from the configured API base URL', () => {
        api.defaults.baseURL = 'https://api.fmmcbs.com';

        expect(buildApiDownloadUrl('/api/archive-zip-exports/zip-1/download'))
            .toBe('https://api.fmmcbs.com/api/archive-zip-exports/zip-1/download');
    });

    it('starts a browser-owned download through a temporary anchor', () => {
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

        startBrowserDownload('/api/archive-zip-exports/zip-1/download');

        expect(clickSpy).toHaveBeenCalledTimes(1);
        expect(document.querySelector('a[href="/api/archive-zip-exports/zip-1/download"]')).not.toBeInTheDocument();
    });
});
