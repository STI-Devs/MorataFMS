<?php

namespace App\Support\Legal;

use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OnlyOfficeCallbackFileFetcher
{
    public function fetch(string $url): string
    {
        $url = trim($url);

        if (! $this->isAllowedUrl($url)) {
            throw new HttpException(422, 'Invalid ONLYOFFICE callback file URL.');
        }

        $response = Http::connectTimeout(5)
            ->timeout($this->timeoutSeconds())
            ->get($url);

        if (! $response->successful()) {
            throw new HttpException(422, 'Unable to fetch ONLYOFFICE callback file.');
        }

        $maxBytes = $this->maxBytes();
        $contentLength = (int) ($response->header('Content-Length') ?? 0);

        if ($contentLength > $maxBytes) {
            throw new HttpException(422, 'ONLYOFFICE callback file is too large.');
        }

        $body = $response->body();

        if (strlen($body) > $maxBytes) {
            throw new HttpException(422, 'ONLYOFFICE callback file is too large.');
        }

        if (! $this->hasAllowedMimeType($response->header('Content-Type'))) {
            throw new HttpException(422, 'ONLYOFFICE callback file type is not allowed.');
        }

        return $body;
    }

    private function isAllowedUrl(string $url): bool
    {
        if ($url === '') {
            return false;
        }

        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));

        return $scheme !== ''
            && $host !== ''
            && in_array($scheme, $this->allowedSchemes(), true)
            && in_array($host, $this->allowedHosts(), true);
    }

    /**
     * @return list<string>
     */
    private function allowedHosts(): array
    {
        $configuredHosts = $this->lowercaseList(config('services.onlyoffice.callback_allowed_hosts', []));

        if ($configuredHosts !== []) {
            return $configuredHosts;
        }

        $documentServerHost = parse_url((string) config('services.onlyoffice.document_server_url'), PHP_URL_HOST);

        if (! is_string($documentServerHost) || $documentServerHost === '') {
            return [];
        }

        return [strtolower($documentServerHost)];
    }

    /**
     * @return list<string>
     */
    private function allowedSchemes(): array
    {
        return $this->lowercaseList(config('services.onlyoffice.callback_allowed_schemes', []));
    }

    /**
     * @return list<string>
     */
    private function allowedMimeTypes(): array
    {
        return $this->lowercaseList(config('services.onlyoffice.callback_allowed_mime_types', []));
    }

    /**
     * @return list<string>
     */
    private function lowercaseList(mixed $values): array
    {
        if (! is_array($values)) {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (mixed $value): string => strtolower(trim((string) $value)),
            $values,
        )));
    }

    private function hasAllowedMimeType(?string $contentType): bool
    {
        $mimeType = strtolower(trim(strtok((string) $contentType, ';') ?: ''));

        return $mimeType !== '' && in_array($mimeType, $this->allowedMimeTypes(), true);
    }

    private function timeoutSeconds(): int
    {
        return max(1, (int) config('services.onlyoffice.callback_timeout_seconds', 30));
    }

    private function maxBytes(): int
    {
        return max(1, (int) config('services.onlyoffice.callback_max_bytes', 52_428_800));
    }
}
