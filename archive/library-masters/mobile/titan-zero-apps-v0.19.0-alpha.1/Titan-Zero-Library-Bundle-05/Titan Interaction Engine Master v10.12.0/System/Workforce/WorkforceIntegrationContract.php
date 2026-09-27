<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Workforce;

final class WorkforceIntegrationContract
{
    public const SCHEMA = 'titan-workforce-extension-integration-v1';
    public const CONTRACT_VERSION = '1.1';

    public static function manifestPath(): string
    {
        return dirname(__DIR__, 2) . '/workforce-integration.json';
    }

    /** @return array<string,mixed> */
    public static function definition(): array
    {
        $raw = file_get_contents(self::manifestPath());
        if ($raw === false) {
            throw new \RuntimeException('Workforce integration manifest is unavailable.');
        }
        $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        if (($decoded['schema'] ?? null) !== self::SCHEMA) {
            throw new \RuntimeException('Unsupported Workforce integration schema.');
        }
        if (($decoded['provider']['contract_version'] ?? null) !== self::CONTRACT_VERSION) {
            throw new \RuntimeException('Unsupported Workforce integration contract version.');
        }

        $releasePath = dirname(__DIR__, 2) . '/extension.json';
        $releaseRaw = file_get_contents($releasePath);
        if ($releaseRaw === false) {
            throw new \RuntimeException('Interaction Engine release manifest is unavailable.');
        }
        $release = json_decode($releaseRaw, true, 512, JSON_THROW_ON_ERROR);
        $releaseVersion = trim((string) ($release['version'] ?? ''));
        $providerVersion = trim((string) ($decoded['provider']['version'] ?? ''));
        if ($releaseVersion === '' || $providerVersion !== $releaseVersion) {
            throw new \RuntimeException('Workforce integration provider version does not match the Interaction Engine release.');
        }

        self::assertProviderVersions($decoded, $providerVersion);
        return $decoded;
    }

    public static function assertCompanyId(int|string $companyId): string
    {
        $value = trim((string) $companyId);
        if ($value === '' || !preg_match('/^[1-9][0-9]*$/', $value)) {
            throw new \InvalidArgumentException('company_id must be a positive integer.');
        }
        return $value;
    }

    /** @return array<string,mixed> */
    public static function executableCommand(string $commandId, array $context): array
    {
        $definition = self::definition();
        $command = null;
        foreach (($definition['commands'] ?? []) as $candidate) {
            if (($candidate['id'] ?? null) === $commandId) {
                $command = $candidate;
                break;
            }
        }
        if (!is_array($command)) {
            throw new \InvalidArgumentException('Unknown Workforce command: ' . $commandId);
        }

        foreach (($command['required_context'] ?? []) as $key) {
            if (!array_key_exists($key, $context) || trim((string) $context[$key]) === '') {
                throw new \InvalidArgumentException('Missing required execution context: ' . $key);
            }
        }
        self::assertCompanyId($context['company_id'] ?? '');

        if (($command['provider_pin_required'] ?? false) !== true
            || trim((string) ($command['provider'] ?? '')) === ''
            || trim((string) ($command['provider_version'] ?? '')) === '') {
            throw new \RuntimeException('Executable Workforce command is not pinned to a provider/version.');
        }
        if (($command['idempotency_required'] ?? false) !== true
            || ($command['receipt_required'] ?? false) !== true
            || ($command['evidence_required'] ?? false) !== true) {
            throw new \RuntimeException('Executable Workforce command is missing idempotency/receipt/evidence requirements.');
        }

        return $command;
    }

    /** @param mixed $value */
    private static function assertProviderVersions(mixed $value, string $expected): void
    {
        if (is_array($value)) {
            foreach ($value as $key => $item) {
                if ($key === 'provider_version' && is_string($item) && trim($item) !== $expected) {
                    throw new \RuntimeException('Workforce integration contains a stale provider version pin.');
                }
                self::assertProviderVersions($item, $expected);
            }
        }
    }

}
