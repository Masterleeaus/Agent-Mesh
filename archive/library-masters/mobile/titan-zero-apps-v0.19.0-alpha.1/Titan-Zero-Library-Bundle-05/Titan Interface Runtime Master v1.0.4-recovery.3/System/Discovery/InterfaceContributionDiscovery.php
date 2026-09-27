<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Discovery;

use App\Extensions\TitanInterfaceRuntime\System\Contracts\Discovery\InterfaceContributionDiscoveryContract;
use App\Extensions\TitanInterfaceRuntime\System\Contracts\Registry\InterfaceContributionRegistryContract;

final class InterfaceContributionDiscovery implements InterfaceContributionDiscoveryContract
{
    private InterfaceContributionDiscoverySnapshot $current;

    public function __construct(
        private readonly InterfaceContributionRegistryContract $registry,
        private readonly InterfaceContributionValidator $validator,
        private readonly string $extensionsRoot,
        private readonly array $supportedContractVersions = ['1.0', '1.1'],
    ) {
        $this->current = new InterfaceContributionDiscoverySnapshot();
    }

    public function snapshot(): InterfaceContributionDiscoverySnapshot
    {
        return $this->current;
    }

    public function discover(bool $force = false): InterfaceContributionDiscoverySnapshot
    {
        if (! $force && ($this->current->health !== [] || $this->current->runtimeError !== null)) {
            return $this->current;
        }

        foreach (array_keys($this->registry->all()) as $key) {
            $this->registry->forget($key);
        }

        if (! is_dir($this->extensionsRoot) || ! is_readable($this->extensionsRoot)) {
            return $this->current = new InterfaceContributionDiscoverySnapshot(runtimeError: 'Extension root is unavailable.');
        }

        $directories = glob(rtrim($this->extensionsRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . '*', GLOB_ONLYDIR) ?: [];
        sort($directories, SORT_STRING);
        $health = [];
        $valid = [];

        foreach ($directories as $directory) {
            $source = basename($directory);
            $sidecarPath = $directory . DIRECTORY_SEPARATOR . 'extension.manifest.json';
            if (! is_file($sidecarPath)) {
                continue;
            }

            try {
                $sidecar = $this->decodeJson($sidecarPath);
            } catch (\Throwable $e) {
                $health[$source] = new ContributionHealth($source, null, 'DEGRADED', ['extension.manifest.json invalid: ' . $e->getMessage()], $sidecarPath);
                continue;
            }

            $extensionKey = is_string($sidecar['key'] ?? null) ? $sidecar['key'] : null;
            $declaration = $sidecar['interface_contribution'] ?? null;
            if (! is_array($declaration)) {
                continue;
            }
            if (($declaration['enabled'] ?? false) !== true) {
                $health[$source] = new ContributionHealth($source, $extensionKey, 'DISABLED');
                continue;
            }
            if ($extensionKey === null || $extensionKey === '') {
                $health[$source] = new ContributionHealth($source, null, 'DEGRADED', ['extension key is missing']);
                continue;
            }
            $contractVersion = is_string($declaration['contract_version'] ?? null) ? $declaration['contract_version'] : '';
            if (! in_array($contractVersion, $this->supportedContractVersions, true)) {
                $health[$source] = new ContributionHealth($source, $extensionKey, 'DEGRADED', ['unsupported interface contract version']);
                continue;
            }
            $relative = $declaration['manifest'] ?? null;
            if (! is_string($relative) || $relative === '') {
                $health[$source] = new ContributionHealth($source, $extensionKey, 'DEGRADED', ['interface contribution manifest path is missing']);
                continue;
            }
            $manifestPath = $this->safePath($directory, $relative);
            if ($manifestPath === null) {
                $health[$source] = new ContributionHealth($source, $extensionKey, 'DEGRADED', ['interface contribution manifest path escapes extension root'], $relative);
                continue;
            }
            if (! is_file($manifestPath)) {
                $health[$source] = new ContributionHealth($source, $extensionKey, 'DEGRADED', ['interface contribution manifest file is missing'], $relative);
                continue;
            }

            try {
                $descriptor = $this->decodeJson($manifestPath);
            } catch (\Throwable $e) {
                $health[$source] = new ContributionHealth($source, $extensionKey, 'DEGRADED', ['interface contribution JSON invalid: ' . $e->getMessage()], $relative);
                continue;
            }
            $descriptorVersion = is_string($descriptor['schema_version'] ?? null) ? $descriptor['schema_version'] : '';
            if ($descriptorVersion !== $contractVersion) {
                $health[$source] = new ContributionHealth($source, $extensionKey, 'DEGRADED', ['interface contribution contract declaration does not match descriptor schema_version'], $relative);
                continue;
            }

            try {
                $validation = $this->validator->validate($descriptor, $extensionKey);
            } catch (\Throwable $e) {
                $health[$source] = new ContributionHealth($source, $extensionKey, 'DEGRADED', ['interface contribution validation failed safely: ' . $e->getMessage()], $relative);
                continue;
            }
            if (! $validation->valid()) {
                $health[$source] = new ContributionHealth($source, $extensionKey, 'DEGRADED', $validation->errors, $relative);
                continue;
            }

            $normalized = $this->normalize($descriptor);
            $valid[$extensionKey][] = new NormalizedInterfaceContribution(
                extensionKey: $extensionKey,
                schemaVersion: (string) ($normalized['schema_version'] ?? $contractVersion),
                sourceFolder: $source,
                manifestPath: $relative,
                sha256: hash('sha256', json_encode($normalized, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES)),
                descriptor: $normalized,
            );
        }

        foreach ($valid as $extensionKey => $candidates) {
            if (count($candidates) !== 1) {
                foreach ($candidates as $candidate) {
                    $health[$candidate->sourceFolder] = new ContributionHealth(
                        $candidate->sourceFolder,
                        $extensionKey,
                        'DEGRADED',
                        ["duplicate extension_key '{$extensionKey}' discovered; no candidate was registered"],
                        $candidate->manifestPath,
                    );
                }
                continue;
            }
            $candidate = $candidates[0];
            $this->registry->register($extensionKey, $candidate->jsonSerialize());
            $health[$candidate->sourceFolder] = new ContributionHealth($candidate->sourceFolder, $extensionKey, 'VALID', [], $candidate->manifestPath);
        }

        ksort($health, SORT_STRING);
        $registered = [];
        foreach ($this->registry->all() as $key => $descriptor) {
            $registered[$key] = new NormalizedInterfaceContribution(
                extensionKey: (string) $descriptor['extension_key'],
                schemaVersion: (string) $descriptor['schema_version'],
                sourceFolder: (string) $descriptor['source_folder'],
                manifestPath: (string) $descriptor['manifest_path'],
                sha256: (string) $descriptor['sha256'],
                descriptor: (array) $descriptor['descriptor'],
            );
        }

        return $this->current = new InterfaceContributionDiscoverySnapshot($registered, $health);
    }

    /** @return array<string, mixed> */
    private function decodeJson(string $path): array
    {
        $decoded = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        if (! is_array($decoded) || array_is_list($decoded)) {
            throw new \RuntimeException('root must be a JSON object');
        }
        return $decoded;
    }

    private function safePath(string $root, string $relative): ?string
    {
        $relative = str_replace('\\', '/', $relative);
        if ($relative === '' || str_starts_with($relative, '/') || preg_match('/(^|\/)\.\.(\/|$)/', $relative) === 1) {
            return null;
        }
        $rootReal = realpath($root);
        if ($rootReal === false) return null;
        $candidate = $rootReal . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);
        $parent = realpath(dirname($candidate));
        if ($parent === false || ($parent !== $rootReal && ! str_starts_with($parent . DIRECTORY_SEPARATOR, $rootReal . DIRECTORY_SEPARATOR))) {
            return null;
        }
        return $candidate;
    }

    /** @param array<string,mixed> $value @return array<string,mixed> */
    private function normalize(array $value): array
    {
        unset($value['$schema']);
        return $this->normalizeValue($value);
    }

    /** @return mixed */
    private function normalizeValue(mixed $value): mixed
    {
        if (! is_array($value)) return $value;
        if (array_is_list($value)) return array_map(fn (mixed $item): mixed => $this->normalizeValue($item), $value);
        ksort($value, SORT_STRING);
        foreach ($value as $key => $item) $value[$key] = $this->normalizeValue($item);
        return $value;
    }
}
