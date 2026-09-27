<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\DTO;

final readonly class InteractionDefinition
{
    public function __construct(
        public string $id,
        public string $version,
        public string $name,
        public string $description,
        public string $category,
        public array $permissions,
        /** @var Section[] */
        public array $sections,
        public string $capability,
        public string $type,
        public array $metadata = [],
    ) {}

    public function getSection(string $id): ?Section
    {
        foreach ($this->sections as $section) {
            if ($section->id === $id) {
                return $section;
            }
        }
        return null;
    }

    public function getQuestion(string $key): ?Question
    {
        foreach ($this->sections as $section) {
            foreach ($section->questions as $question) {
                if ($question->key === $key) {
                    return $question;
                }
            }
        }
        return null;
    }
}
