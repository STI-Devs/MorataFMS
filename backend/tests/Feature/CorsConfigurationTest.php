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
