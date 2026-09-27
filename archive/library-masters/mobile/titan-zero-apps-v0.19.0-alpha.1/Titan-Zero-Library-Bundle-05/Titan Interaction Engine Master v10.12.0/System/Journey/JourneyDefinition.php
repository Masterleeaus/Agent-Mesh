<?php

declare(strict_types=1);
namespace App\Extensions\InteractionEngine\System\Journey;

final readonly class JourneyDefinition
{
    /**
     * @param list<string> $wizardIds
     * @param list<string> $surfaces
     * @param list<array<string,mixed>> $requirements Future extension points such as training modules, quizzes, acknowledgements, evidence, certificates or approvals.
     */
    public function __construct(
        public string $id,
        public string $name,
        public array $wizardIds,
        public array $surfaces,
        public array $prerequisites = [],
        public array $requirements = [],
        public array $metadata = [],
    ) {
        if ($id === '' || $name === '' || $wizardIds === []) {
            throw new \InvalidArgumentException('Journey id, name and at least one wizard are required.');
        }
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'wizards' => $this->wizardIds,
            'surfaces' => $this->surfaces,
            'prerequisites' => $this->prerequisites,
            'requirements' => $this->requirements,
            'metadata' => $this->metadata,
        ];
    }
}
