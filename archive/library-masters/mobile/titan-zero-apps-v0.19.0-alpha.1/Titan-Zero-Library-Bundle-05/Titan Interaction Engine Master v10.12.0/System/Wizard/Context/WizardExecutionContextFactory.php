<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard\Context;

final class WizardExecutionContextFactory
{
    public function build(mixed $user, array $input = [], array $headers = [], array $trusted = []): array
    {
        $normalizedHeaders = [];
        foreach ($headers as $name => $value) {
            $normalizedHeaders[strtolower((string) $name)] = is_array($value) ? ($value[0] ?? null) : $value;
        }

        $userId = $this->read($user, 'id');
        $companyId = $this->read($user, 'company_id');

        $roles = $this->normalizeList($this->read($user, 'roles') ?? []);
        $delegatedScopes = $this->normalizeList($this->read($user, 'delegated_scopes') ?? []);
        $deviceId = (string) (
            $normalizedHeaders['x-device-id']
            ?? $input['device_id']
            ?? ''
        );
        $correlationId = (string) (
            $normalizedHeaders['x-correlation-id']
            ?? $input['correlation_id']
            ?? bin2hex(random_bytes(16))
        );
        $causationId = (string) (
            $normalizedHeaders['x-causation-id']
            ?? $input['causation_id']
            ?? $correlationId
        );

        return [
            'company_id' => (string) $companyId,
            'user_id' => $userId === null ? null : (string) $userId,
            'actor_id' => $userId === null ? null : (string) $userId,
            'device_id' => $deviceId,
            'interface' => (string) ($input['interface'] ?? $input['source_surface'] ?? 'api'),
            'source_surface' => (string) ($input['source_surface'] ?? $input['interface'] ?? 'api'),
            'correlation_id' => $correlationId,
            'causation_id' => $causationId,
            'actor_type' => $userId === null ? 'unknown' : 'human',
            'roles' => $roles,
            'delegated_scopes' => $delegatedScopes,
            'authenticated_at' => $this->trustedAuthenticatedAt($user, $trusted),
            'privacy_class' => (string) ($input['privacy_class'] ?? 'company_private'),
        ];
    }

    private function trustedAuthenticatedAt(mixed $user, array $trusted): ?int
    {
        $candidate = $trusted['authenticated_at'] ?? $this->read($user, 'authenticated_at') ?? $this->read($user, 'last_authenticated_at');
        if ($candidate instanceof \DateTimeInterface) return $candidate->getTimestamp();
        if (is_numeric($candidate) && (int) $candidate > 0) return (int) $candidate;
        return null;
    }

    private function read(mixed $source, string $key): mixed
    {
        if (is_array($source)) {
            return $source[$key] ?? null;
        }
        if (is_object($source)) {
            if (isset($source->{$key}) || property_exists($source, $key)) {
                return $source->{$key};
            }
            $method = 'get' . str_replace(' ', '', ucwords(str_replace('_', ' ', $key)));
            if (method_exists($source, $method)) {
                return $source->{$method}();
            }
        }
        return null;
    }

    /** @return list<string> */
    private function normalizeList(mixed $value): array
    {
        if ($value instanceof \Traversable) {
            $value = iterator_to_array($value);
        }
        if (is_string($value)) {
            $value = [$value];
        }
        if (!is_array($value)) {
            return [];
        }

        $normalized = [];
        foreach ($value as $item) {
            if (is_string($item) || is_int($item)) {
                $normalized[] = (string) $item;
                continue;
            }
            if (is_array($item) && isset($item['name'])) {
                $normalized[] = (string) $item['name'];
                continue;
            }
            if (is_object($item) && isset($item->name)) {
                $normalized[] = (string) $item->name;
            }
        }
        return array_values(array_unique(array_filter($normalized, static fn(string $item): bool => $item !== '')));
    }
}
