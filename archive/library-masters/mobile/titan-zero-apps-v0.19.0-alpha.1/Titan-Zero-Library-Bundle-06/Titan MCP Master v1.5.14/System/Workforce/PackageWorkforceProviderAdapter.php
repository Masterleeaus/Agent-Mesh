<?php
declare(strict_types=1);
namespace App\Extensions\TitanMcp\System\Workforce;

final class PackageWorkforceProviderAdapter implements WorkforceProviderRuntimeContract
{
    /** @var list<string> */
    private array $capabilities;

    public function __construct(
        private readonly string $providerKey,
        array $capabilities,
    ) {
        $clean = [];
        foreach ($capabilities as $capability) {
            if (is_string($capability) && $capability !== '') { $clean[$capability] = true; }
        }
        $this->capabilities = array_keys($clean);
    }

    public static function fromPackageRoot(string $root): self
    {
        $path = rtrim($root, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'workforce-integration.json';
        $raw = @file_get_contents($path);
        if ($raw === false) { throw new \RuntimeException('Workforce integration contract not readable.'); }
        $data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        $tenantKey = (string) ($data['tenant_key'] ?? '');
        if ($tenantKey !== 'company_id') {
            throw new \RuntimeException('Authoritative Workforce provider metadata must use company_id as the sole tenant boundary.');
        }
        return new self((string)($data['provider']['extension_key'] ?? ''), (array)($data['capabilities'] ?? []));
    }

    public function providerKey(): string { return $this->providerKey; }
    public function companyScopeKey(): string { return 'company_id'; }
    public function capabilities(): array { return $this->capabilities; }
    public function supports(string $capability): bool { return in_array($capability, $this->capabilities, true); }
}
