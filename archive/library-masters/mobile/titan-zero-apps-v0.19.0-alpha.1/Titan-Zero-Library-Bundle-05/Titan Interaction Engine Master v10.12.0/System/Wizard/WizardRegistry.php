<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Wizard;

use Symfony\Component\Yaml\Yaml;

final class WizardRegistry
{
    /** @var array<string, WizardDefinition> */
    private array $definitions = [];

    public function register(array|WizardDefinition $definition): WizardDefinition
    {
        $wizard = $definition instanceof WizardDefinition ? $definition : WizardDefinition::fromArray($definition);
        $this->definitions[$wizard->id] = $wizard;
        return $wizard;
    }

    public function get(string $id): WizardDefinition
    {
        if (!isset($this->definitions[$id])) {
            throw new \RuntimeException("Wizard '{$id}' is not registered.");
        }
        return $this->definitions[$id];
    }

    public function has(string $id): bool
    {
        return isset($this->definitions[$id]);
    }

    public function all(): array
    {
        return $this->definitions;
    }

    /** Keep only definitions accepted by the active product profile. */
    public function retain(callable $predicate): void
    {
        foreach ($this->definitions as $id => $definition) {
            if (!$predicate($definition)) {
                unset($this->definitions[$id]);
            }
        }
    }

    public function discover(string $directory): int
    {
        if (!is_dir($directory)) {
            return 0;
        }
        $count = 0;
        $files = array_merge(glob(rtrim($directory, '/') . '/*.json') ?: [], glob(rtrim($directory, '/') . '/*.yaml') ?: [], glob(rtrim($directory, '/') . '/*.yml') ?: []);
        sort($files);
        foreach ($files as $file) {
            $contents = file_get_contents($file);
            if ($contents === false) {
                continue;
            }
            $data = str_ends_with($file, '.json') ? json_decode($contents, true, 512, JSON_THROW_ON_ERROR) : Yaml::parse($contents);
            if (is_array($data)) {
                $this->register($data);
                $count++;
            }
        }
        return $count;
    }
}
