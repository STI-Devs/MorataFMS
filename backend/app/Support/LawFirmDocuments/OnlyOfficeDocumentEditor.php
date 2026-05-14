<?php

namespace App\Support\LawFirmDocuments;

use App\Models\NotarialGeneratedDocument;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OnlyOfficeDocumentEditor
{
    /**
     * @return array{document_server_url: string, config: array<string, mixed>}
     */
    public function configForDocument(NotarialGeneratedDocument $document, User $user): array
    {
        $documentServerUrl = rtrim((string) config('services.onlyoffice.document_server_url'), '/');

        if ($documentServerUrl === '') {
            throw new HttpException(422, 'ONLYOFFICE document server is not configured.');
        }

        if ($document->path === null || $document->path === '') {
            throw new HttpException(422, 'This generated document has no stored DOCX file.');
        }

        $expiresAt = now()->addMinutes((int) config('services.onlyoffice.url_ttl_minutes', 720));
        $config = [
            'documentType' => 'word',
            'document' => [
                'fileType' => 'docx',
                'key' => $this->documentKey($document),
                'title' => $document->filename,
                'url' => $this->editorUrl(URL::temporarySignedRoute(
                    'notarial.generated-documents.onlyoffice-file',
                    $expiresAt,
                    ['document' => $document],
                    false,
                )),
                'permissions' => [
                    'download' => true,
                    'edit' => true,
                    'print' => true,
                ],
            ],
            'editorConfig' => [
                'callbackUrl' => $this->editorUrl(URL::temporarySignedRoute(
                    'notarial.generated-documents.onlyoffice-callback',
                    $expiresAt,
                    ['document' => $document],
                    false,
                )),
                'lang' => 'en',
                'mode' => 'edit',
                'user' => [
                    'id' => (string) $user->id,
                    'name' => $user->name,
                ],
                'customization' => [
                    'autosave' => true,
                    'forcesave' => true,
                ],
            ],
        ];

        $token = $this->encodeJwt($config);

        if ($token !== null) {
            $config['token'] = $token;
        }

        return [
            'document_server_url' => $documentServerUrl,
            'config' => $config,
        ];
    }

    private function documentKey(NotarialGeneratedDocument $document): string
    {
        return hash('sha256', implode('|', [
            'notarial-generated-document',
            $document->module,
            $document->id,
            $document->updated_at?->timestamp ?? 0,
            $document->size_bytes,
        ]));
    }

    private function editorUrl(string $relativeSignedUrl): string
    {
        $baseUrl = rtrim((string) config('services.onlyoffice.internal_app_url'), '/');

        if ($baseUrl === '') {
            $baseUrl = rtrim((string) config('app.url'), '/');
        }

        return $baseUrl.'/'.ltrim($relativeSignedUrl, '/');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function encodeJwt(array $payload): ?string
    {
        $secret = (string) config('services.onlyoffice.jwt_secret');

        if ($secret === '') {
            return null;
        }

        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));

        $body = $this->base64UrlEncode(json_encode($payload, JSON_THROW_ON_ERROR));
        $signature = $this->base64UrlEncode(hash_hmac('sha256', "{$header}.{$body}", $secret, true));

        return "{$header}.{$body}.{$signature}";
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
