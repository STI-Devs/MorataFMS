import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

function read(relativePath) {
    return readFileSync(join(rootDir, relativePath), 'utf8');
}

test('frontend package no longer depends on html2pdf.js', () => {
    const pkg = JSON.parse(read('package.json'));
    assert.equal('html2pdf.js' in (pkg.dependencies ?? {}), false);
});

test('forms export flow relies on browser print instead of html2pdf', () => {
    const formsPage = read('src/features/forms/components/FormsPage.tsx');
    assert.doesNotMatch(formsPage, /html2pdf/);
    assert.match(formsPage, /Print \/ Save as PDF/);
});

test('auth bootstrap uses Sanctum cookie auth instead of bearer tokens', () => {
    const authContext = read('src/features/auth/context/AuthContext.tsx');
    const authApi = read('src/features/auth/api/authApi.ts');
    const axiosClient = read('src/lib/axios.ts');

    assert.equal(existsSync(join(rootDir, 'src/features/auth/utils/tokenStorage.ts')), false);
    assert.match(authApi, /sanctum\/csrf-cookie/);
    assert.match(axiosClient, /withCredentials/);
    assert.match(axiosClient, /withXSRFToken/);
    assert.doesNotMatch(authContext, /localStorage/);
    assert.doesNotMatch(authContext, /getAuthToken/);
    assert.doesNotMatch(authContext, /sessionStorage/);
});

test('login flow supports optional Cloudflare Turnstile protection', () => {
    const loginForm = read('src/features/auth/components/LoginForm.tsx');
    const envExample = read('.env.example');

    assert.match(loginForm, /turnstile_token/);
    assert.match(loginForm, /VITE_TURNSTILE_SITE_KEY/);
    assert.match(envExample, /VITE_TURNSTILE_SITE_KEY=/);
});

test('login route csp allows Turnstile inline challenge scripts without loosening the whole app', () => {
    const vercelConfig = JSON.parse(read('vercel.json'));
    const loginHeaders = vercelConfig.headers.find(({ source }) => source === '/login');
    const globalHeaders = vercelConfig.headers.find(({ source }) => source === '/(.*)');
    const loginCsp = loginHeaders.headers.find(({ key }) => key === 'Content-Security-Policy').value;
    const globalCsp = globalHeaders.headers.find(({ key }) => key === 'Content-Security-Policy').value;

    assert.match(loginCsp, /script-src[^;]*'unsafe-inline'/);
    assert.match(loginCsp, /script-src-attr 'none'/);
    assert.doesNotMatch(globalCsp, /script-src[^;]*'unsafe-inline'/);
    assert.match(globalCsp, /script-src-attr 'none'/);
});

test('document preview does not leak signed URLs to Google Docs Viewer', () => {
    const previewHook = read('src/features/tracking/hooks/useDocumentPreview.ts');
    assert.doesNotMatch(previewHook, /docs\.google/);
    assert.match(previewHook, /downloadDocument/);
});

test('lazy page imports target concrete modules instead of feature barrels', () => {
    const lazyPages = read('src/lib/lazyPages.ts');
    assert.doesNotMatch(lazyPages, /features\/[^'"]+\/index/);
});

test('production build no longer emits an html2pdf chunk', () => {
    const assetsDir = join(rootDir, 'dist', 'assets');

    assert.equal(existsSync(assetsDir), true);
    assert.equal(
        readdirSync(assetsDir).some(file => file.toLowerCase().includes('html2pdf')),
        false,
    );
});
