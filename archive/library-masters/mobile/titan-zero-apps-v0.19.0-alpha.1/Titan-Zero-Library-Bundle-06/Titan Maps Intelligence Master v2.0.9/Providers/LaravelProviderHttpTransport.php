<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\Providers;

use App\Extensions\TitanMapsIntelligence\Contracts\ProviderHttpTransport;
use App\Extensions\TitanMapsIntelligence\Exceptions\ProviderException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Throwable;

final class LaravelProviderHttpTransport implements ProviderHttpTransport
{
    private const ALLOWED_HOSTS = ['places.googleapis.com', 'geocode.googleapis.com', 'routes.googleapis.com'];

    public function request(
        string $method,
        string $url,
        array $headers = [],
        array $json = [],
        int $timeoutSeconds = 10,
        int $retryAttempts = 2,
    ): array {
        $parts = parse_url($url);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower((string) ($parts['host'] ?? ''));
        if ($scheme !== 'https' || ! in_array($host, self::ALLOWED_HOSTS, true)) {
            throw ProviderException::fromCode('MAPS_PROVIDER_HOST_DENIED', 'The provider destination is not allowlisted.');
        }

        try {
            $response = Http::acceptJson()
                ->withHeaders($headers)
                ->timeout(max(1, min(30, $timeoutSeconds)))
                ->connectTimeout(max(1, min(10, $timeoutSeconds)))
                ->retry(max(0, min(3, $retryAttempts)), 250, static function (Throwable $exception): bool {
                    return $exception instanceof ConnectionException;
                }, throw: false)
                ->send(strtoupper($method), $url, $json === [] ? [] : ['json' => $json]);
        } catch (Throwable $exception) {
            throw ProviderException::fromCode('MAPS_PROVIDER_UNAVAILABLE', 'The maps provider could not be reached.', [
                'exception_type' => $exception::class,
            ]);
        }

        if ($response->status() === 401 || $response->status() === 403) {
            throw ProviderException::fromCode('MAPS_PROVIDER_AUTH_FAILED', 'The maps provider rejected its configured credential.', ['status' => $response->status()]);
        }
        if ($response->status() === 429) {
            throw ProviderException::fromCode('MAPS_PROVIDER_RATE_LIMITED', 'The maps provider rate limit was reached.', [
                'retry_after' => $response->header('Retry-After'),
            ]);
        }
        if ($response->serverError()) {
            throw ProviderException::fromCode('MAPS_PROVIDER_UNAVAILABLE', 'The maps provider is temporarily unavailable.', [
                'status' => $response->status(),
            ]);
        }
        if ($response->failed()) {
            throw ProviderException::fromCode('MAPS_PROVIDER_REQUEST_REJECTED', 'The maps provider rejected the request.', [
                'status' => $response->status(),
            ]);
        }

        $decoded = $response->json();
        if (! is_array($decoded)) {
            throw ProviderException::fromCode('MAPS_PROVIDER_INVALID_RESPONSE', 'The maps provider returned an invalid response.');
        }

        return $decoded;
    }
}
