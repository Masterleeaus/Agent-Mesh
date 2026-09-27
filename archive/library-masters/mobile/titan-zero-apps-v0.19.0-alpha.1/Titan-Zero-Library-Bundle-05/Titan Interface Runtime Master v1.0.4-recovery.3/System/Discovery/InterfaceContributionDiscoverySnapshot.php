<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\Discovery;

final readonly class InterfaceContributionDiscoverySnapshot implements \JsonSerializable
{
    /**
     * @param array<string, NormalizedInterfaceContribution> $contributions
     * @param array<string, ContributionHealth> $health
     */
    public function __construct(
        public array $contributions = [],
        public array $health = [],
        public ?string $runtimeError = null,
    ) {
    }

    /** @return array<string, int|string|null> */
    public function summary(): array
    {
        $counts = ['VALID' => 0, 'DEGRADED' => 0, 'DISABLED' => 0];
        foreach ($this->health as $item) {
            if (isset($counts[$item->status])) {
                $counts[$item->status]++;
            }
        }

        return [
            'registered' => count($this->contributions),
            'valid' => $counts['VALID'],
            'degraded' => $counts['DEGRADED'],
            'disabled' => $counts['DISABLED'],
            'runtime_error' => $this->runtimeError,
        ];
    }

    /** @return array<string, mixed> */
    public function jsonSerialize(): array
    {
        return [
            'summary' => $this->summary(),
            'contributors' => array_map(static fn (ContributionHealth $item): array => $item->jsonSerialize(), $this->health),
        ];
    }
}
