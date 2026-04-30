import http from 'k6/http';
import { check, group } from 'k6';

const baseUrl = (__ENV.BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        checks: ['rate==1.0'],
    },
};

function url(path) {
    return `${baseUrl}${path}`;
}

export default function () {
    group('allowed public endpoints', () => {
        const rootResponse = http.get(url('/'));
        check(rootResponse, {
            'GET / returns 200': (response) => response.status === 200,
        });

        const healthResponse = http.get(url('/up'));
        check(healthResponse, {
            'GET /up returns 204': (response) => response.status === 204,
        });
    });

    group('nginx blocks direct probes', () => {
        const hiddenFileResponse = http.get(url('/.env'));
        check(hiddenFileResponse, {
            'GET /.env returns 403 or 404': (response) => response.status === 403 || response.status === 404,
        });

        const internalPhpResponse = http.get(url('/index.php'));
        check(internalPhpResponse, {
            'GET /index.php returns 404': (response) => response.status === 404,
        });

        const profilerResponse = http.get(url('/_profiler/phpinfo'));
        check(profilerResponse, {
            'GET /_profiler/phpinfo returns 404': (response) => response.status === 404,
        });
    });

    group('method restrictions', () => {
        const csrfPostResponse = http.post(url('/sanctum/csrf-cookie'), null);
        check(csrfPostResponse, {
            'POST /sanctum/csrf-cookie returns 403 or 405': (response) => response.status === 403 || response.status === 405,
        });
    });
}
