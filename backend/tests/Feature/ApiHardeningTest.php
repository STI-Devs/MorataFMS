<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

test('trusted hosts include local development and the configured app host', function () {
    $trustedHosts = config('app.trusted_hosts');
    $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);

    expect($trustedHosts)->toContain('^localhost$');
    expect($trustedHosts)->toContain('^127\.0\.0\.1$');
    expect($trustedHosts)->toContain('^\[::1\]$');
    expect($trustedHosts)->toContain('^healthcheck\.railway\.app$');

    if (is_string($appHost) && $appHost !== '') {
        expect($trustedHosts)->toContain('^'.preg_quote($appHost, '/').'$');
    }
});

test('json api clients still receive json method mismatch responses', function () {
    $response = $this->getJson('/api/auth/login');

    $response->assertStatus(405);
    expect($response->headers->get('content-type'))->toContain('application/json');
    $response->assertExactJson([
        'message' => 'Method not allowed.',
    ]);
});

test('api domain root returns a minimal plain-text identity response', function () {
    $response = $this->get('/');

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('text/plain');
    expect($response->headers->getCookies())->toBeEmpty();
    expect($response->headers->get('x-ratelimit-limit'))->toBeNull();
    expect($response->headers->get('x-ratelimit-remaining'))->toBeNull();
    $response->assertSeeText('⣿⣿⣿⠟⠛⠛⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⢋⣩⣉⢻⣿⣿', false);
    $response->assertSeeText('MorataFMS API');
});

test('browser visits to unknown api routes receive a plain-text fallback response', function () {
    $response = $this->get('/api/hello');

    $response->assertNotFound();
    expect($response->headers->get('content-type'))->toContain('text/plain');
    $response->assertSeeText('Route not found.');
});

test('browser visits to unknown web routes receive a plain-text not found response', function () {
    $response = $this->get('/docs/ap');

    $response->assertNotFound();
    expect($response->headers->get('content-type'))->toContain('text/plain');
    $response->assertSeeText('Not found.');
});

test('browser visits to protected api routes receive a plain-text unauthenticated response', function () {
    $response = $this->get('/api/documents');

    $response->assertUnauthorized();
    expect($response->headers->get('content-type'))->toContain('text/plain');
    $response->assertSeeText('Authentication required.');
});

test('api responses include a restrictive content security policy', function () {
    $response = $this->get('/');

    expect($response->headers->get('content-security-policy'))
        ->toBe("default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; object-src 'none'");
    expect($response->headers->get('permissions-policy'))->toBeNull();
    expect($response->headers->get('x-xss-protection'))->toBeNull();
});

test('html responses include a browser-safe baseline content security policy', function () {
    config(['app.api_docs_enabled' => true]);

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $response = $this
        ->actingAs($admin)
        ->get('/docs/api');

    $response->assertOk();
    expect($response->headers->get('content-security-policy'))
        ->toBe("base-uri 'self'; frame-ancestors 'self'; form-action 'self'; object-src 'none'");
    expect($response->headers->get('permissions-policy'))
        ->toBe('camera=(), microphone=(), geolocation=()');
});

test('application responses do not emit strict transport security outside production', function () {
    $response = $this->get('/up', [
        'X-Forwarded-Proto' => 'https',
        'CF-Visitor' => '{"scheme":"https"}',
    ]);

    $response->assertNoContent();
    expect($response->headers->get('strict-transport-security'))->toBeNull();
});

test('application responses emit a strict transport security header in production', function () {
    $this->app->detectEnvironment(fn () => 'production');

    $response = $this->get('/up', [
        'X-Forwarded-Proto' => 'https',
        'CF-Visitor' => '{"scheme":"https"}',
    ]);

    $response->assertNoContent();
    expect($response->headers->get('strict-transport-security'))
        ->toBe('max-age=31536000; includeSubDomains');
});

test('health check endpoint returns a minimal no-content response', function () {
    $response = $this->get('/up');

    $response->assertNoContent(204);
    expect($response->headers->getCookies())->toBeEmpty();
    expect($response->headers->get('x-ratelimit-limit'))->toBeNull();
    expect($response->headers->get('x-ratelimit-remaining'))->toBeNull();
});

test('health check endpoint still responds when trusted host enforcement is disabled', function () {
    config(['app.enforce_trusted_hosts' => false]);

    $this->get('/up', [
        'Host' => 'internal-healthcheck.platform',
    ])->assertNoContent(204);
});

test('route cache can be generated successfully', function () {
    $this->artisan('route:cache')->assertSuccessful();
    $this->artisan('route:clear')->assertSuccessful();
});

test('config cache can be generated successfully', function () {
    $this->artisan('config:cache')->assertSuccessful();
    $this->artisan('config:clear')->assertSuccessful();
});

test('legacy root auth routes are not registered', function () {
    $this->post('/login')->assertNotFound();
});

test('scramble docs stay forbidden outside local by default', function () {
    $this->get('/docs/api')->assertForbidden();
});

test('admins can view scramble docs only when explicitly enabled', function () {
    config(['app.api_docs_enabled' => true]);

    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this
        ->actingAs($admin)
        ->get('/docs/api')
        ->assertOk();
});

test('csrf bootstrap endpoint is rate limited at the public perimeter', function () {
    foreach (range(1, 60) as $attempt) {
        $this->get('/sanctum/csrf-cookie')->assertNoContent();
    }

    $response = $this
        ->get('/sanctum/csrf-cookie')
        ->assertStatus(429)
        ->assertJson([
            'message' => 'Too many requests.',
        ]);

    expect($response->headers->get('retry-after'))->not->toBeNull();
    expect($response->headers->get('x-ratelimit-limit'))->toBeNull();
    expect($response->headers->get('x-ratelimit-remaining'))->toBeNull();
});

test('browser api clients receive lightweight plain-text bad request responses', function () {
    Route::get('/api/testing/bad-request', function () {
        throw new BadRequestHttpException('Malformed payload.');
    });

    $response = $this->get('/api/testing/bad-request');

    $response->assertStatus(400);
    expect($response->headers->get('content-type'))->toContain('text/plain');
    $response->assertSeeText('Bad request.');
});

test('json api clients receive lightweight json bad request responses', function () {
    Route::get('/api/testing/bad-request-json', function () {
        throw new BadRequestHttpException('Malformed payload.');
    });

    $this->getJson('/api/testing/bad-request-json')
        ->assertStatus(400)
        ->assertExactJson([
            'message' => 'Bad request.',
        ]);
});

test('browser api clients receive lightweight plain-text server error responses', function () {
    Route::get('/api/testing/server-error', function () {
        throw new RuntimeException('Boom.');
    });

    $response = $this->get('/api/testing/server-error');

    $response->assertStatus(500);
    expect($response->headers->get('content-type'))->toContain('text/plain');
    $response->assertSeeText('Server error.');
});

test('json api clients receive lightweight json server error responses', function () {
    Route::get('/api/testing/server-error-json', function () {
        throw new RuntimeException('Boom.');
    });

    $this->getJson('/api/testing/server-error-json')
        ->assertStatus(500)
        ->assertExactJson([
            'message' => 'Server error.',
        ]);
});
