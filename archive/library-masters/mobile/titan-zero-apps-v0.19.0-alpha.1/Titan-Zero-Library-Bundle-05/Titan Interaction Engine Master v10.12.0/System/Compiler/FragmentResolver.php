<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Compiler;

use Illuminate\Support\Facades\File;

class FragmentResolver
{
    private string $fragmentsPath;

    public function __construct()
    {
        $this->fragmentsPath = config('interaction-engine.fragments_path');
    }

    public function resolve(array $definition): array
    {
        if (isset($definition['include'])) {
            $fragment = $this->loadFragment($definition['include']);
            $definition = $this->mergeFragments($fragment, $definition);
        }
        if (isset($definition['extends'])) {
            $parent = $this->loadFragment($definition['extends']);
            $definition = $this->mergeInheritance($parent, $definition);
        }
        return $definition;
    }

    private function loadFragment(string $path): array
    {
        $fullPath = $this->fragmentsPath . '/' . $path . '.json';
        if (!File::exists($fullPath)) {
            throw new \RuntimeException("Fragment '{$path}' not found.");
        }
        return json_decode(File::get($fullPath), true);
    }

    private function mergeFragments(array $fragment, array $definition): array
    {
        if (isset($fragment['sections'])) {
            $definition['sections'] = array_merge($fragment['sections'], $definition['sections'] ?? []);
        }
        return array_merge($fragment, $definition);
    }

    private function mergeInheritance(array $parent, array $child): array
    {
        return array_merge($parent, $child);
    }
}
