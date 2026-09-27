<?php

declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

final class TitanAppsNavigationService
{
    public function __construct(
        private readonly TitanAppsModuleLibrary $library,
        private readonly PwaNativeSurfaceRegistry $nativeSurfaces,
        private readonly AppSurfaceAudienceResolver $audiences,
    ) {
    }

    /** @return array<string,array<string,mixed>> */
    public function catalog(): array
    {
        return $this->library->catalog();
    }

    /** @return list<array<string,mixed>> */
    public function availableModules(string $botType): array
    {
        return $this->library->availableFor($botType);
    }

    /** @return list<array<string,mixed>> */
    public function navigationLinks(string $botType): array
    {
        return $this->linksForIds($botType, $this->library->navigationDefaults($botType), false);
    }

    /** @return list<array<string,mixed>> */
    public function footerLinks(string $botType): array
    {
        return $this->linksForIds($botType, $this->library->footerDefaults($botType), true);
    }

    public function isAllowed(string $botType, string $module): bool
    {
        $definition = $this->library->definition($module);
        if (! is_array($definition) || $this->library->roleVariant($module, $this->audiences->catalogueAudience($botType)) === null) {
            return false;
        }

        // Equivalent to the legacy invariant: return $view === '' || $view === 'module'
        return trim((string) ($definition['view'] ?? 'module')) === 'module';
    }

    public function isAvailable(string $botType, string $module): bool
    {
        return $this->library->roleVariant($module, $this->audiences->catalogueAudience($botType)) !== null;
    }

    public function modulePlatformRoute(string $botType, string $module): string
    {
        if (! $this->isAvailable($botType, $module)) {
            return '';
        }

        $botType = $this->audiences->catalogueAudience($botType);
        if (! $this->nativeSurfaces->advancedFallbackAllowed($botType, $module)) {
            return '';
        }

        return $this->nativeSurfaces->advancedFallbackRoute($botType, $module);
    }

    /** @param list<string> $ids @return list<array<string,mixed>> */
    private function linksForIds(string $botType, array $ids, bool $footer): array
    {
        $botType = $this->audiences->catalogueAudience($botType);
        $result = [];

        foreach (array_values($ids) as $index => $module) {
            $module = (string) $module;
            if (! $this->isAvailable($botType, $module)) {
                continue;
            }

            $definition = (array) ($this->library->definition($module) ?? []);
            $view = trim((string) ($definition['view'] ?? 'module'));
            if (! in_array($view, ['welcome', 'conversations-list', 'articles-list', 'settings', 'module', 'platform'], true)) {
                $view = 'module';
            }

            $result[] = [
                'id' => ($footer ? 'footer-' : 'nav-') . $botType . '-' . $module,
                'label' => trim((string) ($definition['label'] ?? $module)),
                'icon' => trim((string) ($definition['icon'] ?? '•')),
                'view' => $view,
                'module' => $view === 'module' ? $module : '',
                'catalog_id' => $module,
                'group' => $this->library->groupFor($botType, $module),
                'route' => $view === 'platform' ? $this->modulePlatformRoute($botType, $module) : '',
                'url' => '',
                'enabled' => true,
                'sort_order' => $index,
                'open_mode' => 'same',
                'required_permission' => trim((string) ($definition['permission'] ?? '')),
            ];
        }

        return $result;
    }

}
