<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Engines\HumanInteraction\Contracts;

interface PersonalityEngineInterface
{
    public function detect(array $context): array;
    public function getProfile(int $userId): array;
    public function adapt(array $profile): void;
}
