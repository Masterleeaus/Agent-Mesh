<?php

declare(strict_types=1);

namespace App\Extensions\TitanMapsIntelligence\DTO;

final readonly class ExternalPlaceData
{
    public function __construct(
        public string $provider,
        public string $providerPlaceId,
        public string $name,
        public ?string $address = null,
        public ?Coordinates $coordinates = null,
        public ?string $phone = null,
        public ?string $website = null,
        public ?string $email = null,
        public array $categories = [],
        public ?string $primaryCategory = null,
        public ?float $rating = null,
        public ?int $reviewCount = null,
        public ?string $businessStatus = null,
        public ?bool $currentlyOpen = null,
        public array $openingHours = [],
        public ?string $sourceUrl = null,
        public array $attributions = [],
        public array $providerMetadata = [],
        public ?string $nextPageToken = null,
    ) {}

    public function toArray(): array
    {
        return [
            'provider' => $this->provider,
            'provider_place_id' => $this->providerPlaceId,
            'name' => $this->name,
            'address' => $this->address,
            'latitude' => $this->coordinates?->latitude,
            'longitude' => $this->coordinates?->longitude,
            'phone' => $this->phone,
            'website' => $this->website,
            'public_email' => $this->email,
            'categories' => $this->categories,
            'primary_category' => $this->primaryCategory,
            'rating' => $this->rating,
            'review_count' => $this->reviewCount,
            'business_status' => $this->businessStatus,
            'currently_open' => $this->currentlyOpen,
            'opening_hours' => $this->openingHours,
            'source_url' => $this->sourceUrl,
            'attributions' => $this->attributions,
            'provider_metadata' => $this->providerMetadata,
        ];
    }
}
