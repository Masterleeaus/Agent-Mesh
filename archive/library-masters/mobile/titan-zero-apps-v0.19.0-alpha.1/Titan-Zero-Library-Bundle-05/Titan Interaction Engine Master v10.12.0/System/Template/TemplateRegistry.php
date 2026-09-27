<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Template;

final class TemplateRegistry
{
    /** @var array<string, TemplateDefinition> */
    private array $templates = [];

    public function register(array|TemplateDefinition $definition): TemplateDefinition
    {
        $template = $definition instanceof TemplateDefinition ? $definition : TemplateDefinition::fromArray($definition);
        if (isset($this->templates[$template->id])) {
            throw new \RuntimeException("Template '{$template->id}' is already registered.");
        }
        $this->templates[$template->id] = $template;
        return $template;
    }

    public function get(string $id): TemplateDefinition
    {
        if (!isset($this->templates[$id])) {
            throw new \RuntimeException("Template '{$id}' is not registered.");
        }
        return $this->templates[$id];
    }

    public function has(string $id): bool
    {
        return isset($this->templates[$id]);
    }

    /** @return array<string, TemplateDefinition> */
    public function all(): array
    {
        return $this->templates;
    }

    /** Keep only templates accepted by the active product profile. */
    public function retain(callable $predicate): void
    {
        foreach ($this->templates as $id => $template) {
            if (!$predicate($template)) {
                unset($this->templates[$id]);
            }
        }
    }

    public function discover(string $directory): int
    {
        if (!is_dir($directory)) {
            return 0;
        }
        $files = glob(rtrim($directory, '/') . '/*.json') ?: [];
        sort($files);
        foreach ($files as $file) {
            $data = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
            $this->register((array) $data);
        }
        return count($files);
    }
}
