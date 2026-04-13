<?php

return [
    'production_mirror' => [
        'source' => [
            'host' => env('PRODUCTION_MIRROR_SOURCE_HOST'),
            'port' => env('PRODUCTION_MIRROR_SOURCE_PORT', '3306'),
            'database' => env('PRODUCTION_MIRROR_SOURCE_DATABASE', 'railway'),
            'username' => env('PRODUCTION_MIRROR_SOURCE_USERNAME', 'root'),
            'password' => env('PRODUCTION_MIRROR_SOURCE_PASSWORD'),
        ],
        'local' => [
            'docker_service' => env('PRODUCTION_MIRROR_LOCAL_DOCKER_SERVICE', 'mysql'),
            'root_password' => env('PRODUCTION_MIRROR_LOCAL_ROOT_PASSWORD', 'root'),
            'database' => env('PRODUCTION_MIRROR_LOCAL_DATABASE', 'morata_fms_prod_mirror'),
        ],
        'snapshots' => [
            'path' => env('PRODUCTION_MIRROR_SNAPSHOT_PATH', dirname(__DIR__).DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'production-mirror'),
            'directory' => env('PRODUCTION_MIRROR_SNAPSHOT_DIRECTORY', 'production-mirror'),
        ],
    ],
];
