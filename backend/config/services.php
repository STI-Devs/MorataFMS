<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'turnstile' => [
        'enabled' => (bool) env('TURNSTILE_ENABLED', false),
        'secret_key' => env('TURNSTILE_SECRET_KEY'),
        'siteverify_url' => 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    ],

    'onlyoffice' => [
        'document_server_url' => env('ONLYOFFICE_DOCUMENT_SERVER_URL'),
        'internal_app_url' => env('ONLYOFFICE_INTERNAL_APP_URL', env('APP_URL')),
        'jwt_secret' => env('ONLYOFFICE_JWT_SECRET'),
        'url_ttl_minutes' => (int) env('ONLYOFFICE_URL_TTL_MINUTES', 720),
        'callback_allowed_hosts' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('ONLYOFFICE_CALLBACK_ALLOWED_HOSTS', '')),
        ))),
        'callback_allowed_schemes' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('ONLYOFFICE_CALLBACK_ALLOWED_SCHEMES', 'https,http')),
        ))),
        'callback_allowed_mime_types' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env(
                'ONLYOFFICE_CALLBACK_ALLOWED_MIME_TYPES',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream',
            )),
        ))),
        'callback_timeout_seconds' => (int) env('ONLYOFFICE_CALLBACK_TIMEOUT_SECONDS', 30),
        'callback_max_bytes' => (int) env('ONLYOFFICE_CALLBACK_MAX_BYTES', 52_428_800),
    ],

];
