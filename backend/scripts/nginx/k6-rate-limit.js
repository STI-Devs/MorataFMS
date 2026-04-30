import http from 'k6/http';
import { check } from 'k6';
import { Rate } from 'k6/metrics';

const baseUrl = (__ENV.BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const spaOrigin = (__ENV.SPA_ORIGIN || baseUrl).replace(/\/$/, '');
const spaReferer = __ENV.SPA_REFERER || `${spaOrigin}/`;
const turnstileToken = __ENV.TURNSTILE_TOKEN || '';

const enableNginxCsrfBurst = (__ENV.ENABLE_NGINX_CSRF_BURST || '1') === '1';
const enableNginxLoginBurst = (__ENV.ENABLE_NGINX_LOGIN_BURST || '0') === '1';
const enableInvalidLoginThrottle = (__ENV.ENABLE_INVALID_LOGIN_THROTTLE || '0') === '1';
const enableApiGeneralBurst = (__ENV.ENABLE_API_GENERAL_BURST || '0') === '1';
const enableApiSearchBurst = (__ENV.ENABLE_API_SEARCH_BURST || '0') === '1';
const enableApiAdminBurst = (__ENV.ENABLE_API_ADMIN_BURST || '0') === '1';

const csrfRequestCount = Number(__ENV.CSRF_BURST_REQUESTS || 20);
const nginxLoginRequestCount = Number(__ENV.NGINX_LOGIN_BURST_REQUESTS || 20);
const invalidLoginRequestCount = Number(__ENV.INVALID_LOGIN_REQUESTS || 6);
const apiGeneralRequestCount = Number(__ENV.API_GENERAL_REQUESTS || 95);
const apiSearchRequestCount = Number(__ENV.API_SEARCH_REQUESTS || 50);
const apiAdminRequestCount = Number(__ENV.API_ADMIN_REQUESTS || 130);
const burstBatchSize = Number(__ENV.BURST_BATCH_SIZE || 25);

const validLoginEmail = __ENV.LOGIN_EMAIL || '';
const validLoginPassword = __ENV.LOGIN_PASSWORD || '';
const invalidLoginEmail = __ENV.INVALID_LOGIN_EMAIL || 'rate-limit-test@example.invalid';
const invalidLoginPassword = __ENV.INVALID_LOGIN_PASSWORD || 'definitely-wrong-password';

const csrfRateLimited = new Rate('csrf_rate_limited');
const nginxLoginRateLimited = new Rate('nginx_login_rate_limited');
const invalidLoginThrottled = new Rate('invalid_login_throttled');
const apiGeneralRateLimited = new Rate('api_general_rate_limited');
const apiSearchRateLimited = new Rate('api_search_rate_limited');
const apiAdminRateLimited = new Rate('api_admin_rate_limited');

function url(path) {
    return `${baseUrl}${path}`;
}

function buildBrowserLikeHeaders() {
    return {
        Accept: 'application/json',
        Origin: spaOrigin,
        Referer: spaReferer,
        'X-Requested-With': 'XMLHttpRequest',
    };
}

function hasEnabledAuthScenario() {
    return enableInvalidLoginThrottle || enableApiGeneralBurst || enableApiSearchBurst || enableApiAdminBurst || enableNginxLoginBurst;
}

function requireCredentials() {
    if (validLoginEmail !== '' && validLoginPassword !== '') {
        return;
    }

    throw new Error('LOGIN_EMAIL and LOGIN_PASSWORD are required for the enabled auth scenarios.');
}

function createScenario(executionName, startTime = '0s') {
    return {
        executor: 'per-vu-iterations',
        vus: 1,
        iterations: 1,
        exec: executionName,
        startTime,
    };
}

const scenarios = {};

if (enableNginxCsrfBurst) {
    scenarios.csrf_burst = createScenario('runCsrfBurst');
}

let nextStartSeconds = enableNginxCsrfBurst ? 3 : 0;

if (enableNginxLoginBurst) {
    scenarios.nginx_login_burst = createScenario('runNginxLoginBurst', `${nextStartSeconds}s`);
    nextStartSeconds += 4;
}

if (enableInvalidLoginThrottle) {
    scenarios.invalid_login_throttle = createScenario('runInvalidLoginThrottle', `${nextStartSeconds}s`);
    nextStartSeconds += 4;
}

if (enableApiGeneralBurst) {
    scenarios.api_general_burst = createScenario('runApiGeneralBurst', `${nextStartSeconds}s`);
    nextStartSeconds += 4;
}

if (enableApiSearchBurst) {
    scenarios.api_search_burst = createScenario('runApiSearchBurst', `${nextStartSeconds}s`);
    nextStartSeconds += 4;
}

if (enableApiAdminBurst) {
    scenarios.api_admin_burst = createScenario('runApiAdminBurst', `${nextStartSeconds}s`);
}

if (Object.keys(scenarios).length === 0) {
    scenarios.csrf_burst = createScenario('runCsrfBurst');
}

const thresholds = {
    checks: ['rate>0.95'],
};

if (enableNginxCsrfBurst) {
    thresholds.csrf_rate_limited = ['rate>0'];
}

if (enableNginxLoginBurst) {
    thresholds.nginx_login_rate_limited = ['rate>0'];
}

if (enableInvalidLoginThrottle) {
    thresholds.invalid_login_throttled = ['rate>0'];
}

if (enableApiGeneralBurst) {
    thresholds.api_general_rate_limited = ['rate>0'];
}

if (enableApiSearchBurst) {
    thresholds.api_search_rate_limited = ['rate>0'];
}

if (enableApiAdminBurst) {
    thresholds.api_admin_rate_limited = ['rate>0'];
}

export const options = {
    scenarios,
    thresholds,
};

function buildJsonHeaders(xsrfToken) {
    const headers = {
        ...buildBrowserLikeHeaders(),
        'Content-Type': 'application/json',
    };

    if (xsrfToken) {
        headers['X-XSRF-TOKEN'] = xsrfToken;
    }

    return headers;
}

function getDecodedXsrfToken(cookieJar) {
    const cookies = cookieJar.cookiesForURL(baseUrl)['XSRF-TOKEN'];

    if (! cookies || cookies.length === 0) {
        return null;
    }

    return decodeURIComponent(cookies[0]);
}

function bootstrapSpaSession() {
    const cookieJar = http.cookieJar();
    const response = http.get(url('/sanctum/csrf-cookie'), {
        jar: cookieJar,
        headers: buildBrowserLikeHeaders(),
    });

    check(response, {
        'csrf bootstrap returns 204': (result) => result.status === 204,
    });

    return {
        cookieJar,
        xsrfToken: getDecodedXsrfToken(cookieJar),
        csrfResponse: response,
    };
}

function login(email, password) {
    const session = bootstrapSpaSession();
    const payload = {
        email,
        password,
    };

    if (turnstileToken !== '') {
        payload.turnstile_token = turnstileToken;
    }

    const response = http.post(url('/api/auth/login'), JSON.stringify(payload), {
        jar: session.cookieJar,
        headers: buildJsonHeaders(session.xsrfToken),
    });

    return {
        ...session,
        response,
    };
}

function responseHasThrottleMessage(response) {
    return (response.status === 422 || response.status === 429)
        && response.body.toLowerCase().includes('too many');
}

function responseHasAuthFailureMessage(response) {
    return response.status === 422
        && (
            response.body.toLowerCase().includes('auth.failed')
            || response.body.toLowerCase().includes('credentials do not match')
            || response.body.toLowerCase().includes('these credentials do not match')
        );
}

function responseHasRetryAfterHeader(response) {
    return response.headers['Retry-After'] !== undefined;
}

function truncateBody(body) {
    return body.length > 500 ? `${body.slice(0, 500)}...` : body;
}

function assertAuthenticatedLogin(result) {
    if (result.response.status !== 200) {
        console.error(
            `Valid login failed with status ${result.response.status}: ${truncateBody(result.response.body)}`
        );
    }

    check(result.response, {
        'valid login returns 200': (response) => response.status === 200,
        'valid login returns user payload': (response) => response.json('user') !== undefined,
    });
}

function burstGet(session, path, requestCount, metric, label, okStatus) {
    const requestParams = {
        jar: session.cookieJar,
        headers: buildBrowserLikeHeaders(),
    };

    for (let offset = 0; offset < requestCount; offset += burstBatchSize) {
        const currentBatchSize = Math.min(burstBatchSize, requestCount - offset);
        const requests = Array.from({ length: currentBatchSize }, () => ['GET', url(path), null, requestParams]);
        const responses = http.batch(requests);

        responses.forEach((response) => {
            metric.add(response.status === 429);

            check(response, {
                [label]: (result) => result.status === okStatus || result.status === 429,
                [`${label} throttle responses include retry metadata`]: (result) =>
                    result.status !== 429 || responseHasRetryAfterHeader(result),
                [`${label} throttle responses include message`]: (result) =>
                    result.status !== 429 || responseHasThrottleMessage(result),
            });
        });
    }
}

export function runCsrfBurst() {
    for (let attempt = 0; attempt < csrfRequestCount; attempt += 1) {
        const response = http.get(url('/sanctum/csrf-cookie'), {
            headers: buildBrowserLikeHeaders(),
        });
        csrfRateLimited.add(response.status === 429);

        check(response, {
            'csrf burst returns 204 or 429': (result) => result.status === 204 || result.status === 429,
        });
    }
}

export function runNginxLoginBurst() {
    requireCredentials();

    const session = bootstrapSpaSession();
    const payload = {
        email: validLoginEmail,
        password: validLoginPassword,
    };

    if (turnstileToken !== '') {
        payload.turnstile_token = turnstileToken;
    }

    for (let attempt = 0; attempt < nginxLoginRequestCount; attempt += 1) {
        const response = http.post(url('/api/auth/login'), JSON.stringify(payload), {
            jar: session.cookieJar,
            headers: buildJsonHeaders(session.xsrfToken),
        });

        nginxLoginRateLimited.add(response.status === 429);

        check(response, {
            'nginx login burst returns 200, 422, or 429': (result) =>
                result.status === 200 || result.status === 422 || result.status === 429,
            'nginx login 429 responses include retry metadata': (result) =>
                result.status !== 429 || responseHasRetryAfterHeader(result),
        });
    }
}

export function runInvalidLoginThrottle() {
    requireCredentials();

    const session = bootstrapSpaSession();
    const payload = {
        email: invalidLoginEmail,
        password: invalidLoginPassword,
    };

    if (turnstileToken !== '') {
        payload.turnstile_token = turnstileToken;
    }

    for (let attempt = 0; attempt < invalidLoginRequestCount; attempt += 1) {
        const response = http.post(url('/api/auth/login'), JSON.stringify(payload), {
            jar: session.cookieJar,
            headers: buildJsonHeaders(session.xsrfToken),
        });

        invalidLoginThrottled.add(responseHasThrottleMessage(response));

        check(response, {
            'invalid login throttle returns 422 or 429': (result) => result.status === 422 || result.status === 429,
            'invalid login throttle returns failed-or-throttled message': (result) =>
                responseHasAuthFailureMessage(result) || responseHasThrottleMessage(result),
        });
    }
}

export function runApiGeneralBurst() {
    requireCredentials();

    const session = login(validLoginEmail, validLoginPassword);
    assertAuthenticatedLogin(session);

    burstGet(
        session,
        '/api/user',
        apiGeneralRequestCount,
        apiGeneralRateLimited,
        'api-general burst returns 200 or 429',
        200
    );
}

export function runApiSearchBurst() {
    requireCredentials();

    const session = login(validLoginEmail, validLoginPassword);
    assertAuthenticatedLogin(session);

    burstGet(
        session,
        '/api/documents/transactions',
        apiSearchRequestCount,
        apiSearchRateLimited,
        'api-search burst returns 200 or 429',
        200
    );
}

export function runApiAdminBurst() {
    requireCredentials();

    const session = login(validLoginEmail, validLoginPassword);
    assertAuthenticatedLogin(session);

    burstGet(
        session,
        '/api/users',
        apiAdminRequestCount,
        apiAdminRateLimited,
        'admin route burst returns 200 or 429',
        200
    );
}
