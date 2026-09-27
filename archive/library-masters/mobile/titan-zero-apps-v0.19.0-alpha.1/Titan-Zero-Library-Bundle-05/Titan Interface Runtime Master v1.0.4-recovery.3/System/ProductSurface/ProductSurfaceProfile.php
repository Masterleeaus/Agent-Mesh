<?php

declare(strict_types=1);

namespace App\Extensions\TitanInterfaceRuntime\System\ProductSurface;

final readonly class ProductSurfaceProfile implements \JsonSerializable
{
    /** @param list<string> $preferredContainers */
    public function __construct(
        public string $surface,
        public string $audience,
        public string $density,
        public bool $mobileFirst,
        public bool $progressiveDisclosure,
        public bool $advancedControls,
        public bool $customerSafeRequired,
        public string $navigationMode,
        public int $maxPrimaryActions,
        public array $preferredContainers,
    ) {
        if (! in_array($surface, ['command','go','hub','onboarding'], true)) throw new \InvalidArgumentException('Unsupported product surface profile.');
        if ($maxPrimaryActions < 1 || $maxPrimaryActions > 20) throw new \InvalidArgumentException('Product surface action budget is invalid.');
    }

    public function jsonSerialize(): array
    {
        return [
            'surface'=>$this->surface,
            'audience'=>$this->audience,
            'density'=>$this->density,
            'mobile_first'=>$this->mobileFirst,
            'progressive_disclosure'=>$this->progressiveDisclosure,
            'advanced_controls'=>$this->advancedControls,
            'customer_safe_required'=>$this->customerSafeRequired,
            'navigation_mode'=>$this->navigationMode,
            'max_primary_actions'=>$this->maxPrimaryActions,
            'preferred_containers'=>$this->preferredContainers,
        ];
    }
}
