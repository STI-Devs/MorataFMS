<?php

test('cors allows the authorization header used by bearer token requests', function () {
    expect(config('cors.allowed_headers'))->toContain('Authorization');
});

test('cors preflight accepts authorization header requests from the frontend origin', function () {
    $response = $this->options('/api/user', [], [
        'Origin' => 'http://localhost:3000',
        'Access-Control-Request-Method' => 'GET',
        'Access-Control-Request-Headers' => 'authorization',
    ]);

    $response->assertNoContent();
    expect($response->headers->get('Access-Control-Allow-Origin'))->toBe('http://localhost:3000');
    expect($response->headers->get('Access-Control-Allow-Headers'))->toContain('authorization');
});
