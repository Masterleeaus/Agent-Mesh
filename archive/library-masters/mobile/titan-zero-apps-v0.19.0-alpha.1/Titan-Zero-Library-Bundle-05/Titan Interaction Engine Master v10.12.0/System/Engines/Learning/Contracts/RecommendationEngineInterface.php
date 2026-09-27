<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\Learning\Contracts;

interface RecommendationEngineInterface
{
    public function recommend(int $userId, array $context): array;
    public function getSimilarItems(string $itemId): array;
    public function getTrending(): array;
}
