<?php

test('cors supports credentialed requests for the frontend origin', function () {
    expect(config('cors.supports_credentials'))->toBeTrue();
});

test('cors preflight accepts xsrf token header requests from the frontend origin', function () {
    $response = $this->options('/api/user', [], [
        'Origin' => 'http://localhost:3000',
        'Access-Control-Request-Method' => 'GET',
        'Access-Control-Request-Headers' => 'x-xsrf-token',
    ]);

    $response->assertNoContent();
    expect($response->headers->get('Access-Control-Allow-Origin'))->toBe('http://localhost:3000');
    expect($response->headers->get('Access-Control-Allow-Credentials'))->toBe('true');
    expect($response->headers->get('Access-Control-Allow-Headers'))->toContain('x-xsrf-token');
});

test('cors preflight accepts csrf bootstrap requests from the frontend origin', function () {
    $response = $this->options('/sanctum/csrf-cookie', [], [
        'Origin' => 'http://localhost:3000',
        'Access-Control-Request-Method' => 'GET',
        'Access-Control-Request-Headers' => 'x-requested-with',
    ]);

    $response->assertNoContent();
    expect($response->headers->get('Access-Control-Allow-Origin'))->toBe('http://localhost:3000');
    expect($response->headers->get('Access-Control-Allow-Credentials'))->toBe('true');
    expect($response->headers->get('Access-Control-Allow-Headers'))->toContain('x-requested-with');
});

test('cors preflight accepts signed local storage upload requests from the frontend origin', function () {
    $response = $this->options('/storage/legacy-batches/test-batch/test-file.pdf?upload=1', [], [
        'Origin' => 'http://localhost:3000',
        'Access-Control-Request-Method' => 'PUT',
        'Access-Control-Request-Headers' => 'content-type',
    ]);

    $response->assertNoContent();
    expect($response->headers->get('Access-Control-Allow-Origin'))->toBe('http://localhost:3000');
    expect($response->headers->get('Access-Control-Allow-Credentials'))->toBe('true');
    expect($response->headers->get('Access-Control-Allow-Headers'))->toContain('content-type');
});
