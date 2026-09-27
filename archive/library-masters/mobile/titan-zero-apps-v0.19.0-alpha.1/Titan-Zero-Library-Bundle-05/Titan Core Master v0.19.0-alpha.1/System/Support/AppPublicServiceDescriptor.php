<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Support;

use App\Extensions\TitanAppsCore\System\Contracts\AppPublicService;

final readonly class AppPublicServiceDescriptor implements AppPublicService
{
    /** @param list<string> $contracts */
    public function __construct(
        private string $serviceId,
        private string $serviceOwner,
        private bool $accessible,
        private array $contracts,
    ) {}

    public function id(): string { return $this->serviceId; }
    public function owner(): string { return $this->serviceOwner; }
    public function platformAccessible(): bool { return $this->accessible; }

    /** @return list<string> */
    public function contractCandidates(): array { return $this->contracts; }

    /** @return array<string,mixed> */
    public function toArray(): array
    {
        return [
            'id'=>$this->id(),
            'owner'=>$this->owner(),
            'platform_accessible'=>$this->platformAccessible(),
            'contracts'=>$this->contractCandidates(),
        ];
    }
}
