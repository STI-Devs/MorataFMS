<?php

namespace App\Support\Cache;

use Illuminate\Support\Facades\Cache;

/**
 * Centralizes cache keys + TTL + invalidation for reference data lookups
 * (countries, locations of goods). Keeping the registry in one place keeps
 * the explicit-key invalidation tractable on cache drivers that do not
 * support tags (e.g. database, file).
 */
class ReferenceDataCache
{
    public const COUNTRIES_PREFIX = 'reference-data:countries';

    public const LOCATIONS_OF_GOODS_PREFIX = 'reference-data:locations-of-goods';

    private const TTL_MINUTES = 15;

    public static function ttlSeconds(): int
    {
        return self::TTL_MINUTES * 60;
    }

    public static function countryKey(bool $includeInactive, ?string $type): string
    {
        return self::compose(self::COUNTRIES_PREFIX, [
            $includeInactive ? 'with-inactive' : 'active-only',
            'type:'.($type ?? 'any'),
        ]);
    }

    public static function locationOfGoodsKey(bool $includeInactive): string
    {
        return self::compose(self::LOCATIONS_OF_GOODS_PREFIX, [
            $includeInactive ? 'with-inactive' : 'active-only',
        ]);
    }

    /**
     * Forget every cached variant of the country reference list.
     */
    public static function forgetCountries(): void
    {
        foreach (self::countryKeyVariants() as $key) {
            Cache::forget($key);
        }
    }

    /**
     * Forget every cached variant of the location-of-goods reference list.
     */
    public static function forgetLocationsOfGoods(): void
    {
        foreach (self::locationOfGoodsKeyVariants() as $key) {
            Cache::forget($key);
        }
    }

    /**
     * @return list<string>
     */
    private static function countryKeyVariants(): array
    {
        $variants = [];

        foreach ([true, false] as $includeInactive) {
            foreach ([null, 'import_origin', 'export_destination', 'both'] as $type) {
                $variants[] = self::countryKey($includeInactive, $type);
            }
        }

        return $variants;
    }

    /**
     * @return list<string>
     */
    private static function locationOfGoodsKeyVariants(): array
    {
        return [
            self::locationOfGoodsKey(true),
            self::locationOfGoodsKey(false),
        ];
    }

    /**
     * @param  list<string>  $segments
     */
    private static function compose(string $prefix, array $segments): string
    {
        return $prefix.':'.implode(':', $segments);
    }
}
