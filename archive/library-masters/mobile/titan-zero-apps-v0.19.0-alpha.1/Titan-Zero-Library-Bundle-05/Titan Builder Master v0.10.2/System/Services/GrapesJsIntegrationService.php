<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Services;

/**
 * GrapesJS Integration Service
 * Converts between GrapesJS format and internal dashboard spec
 * Provides visual drag-and-drop editor integration
 */
final class GrapesJsIntegrationService
{
    /**
     * Convert GrapesJS exported data to internal spec format
     */
    public function toInternalSpec(array $grapesJsData): array
    {
        $pages = $grapesJsData['pages'] ?? [];
        $components = $grapesJsData['components'] ?? [];
        $styles = $grapesJsData['css'] ?? '';

        return [
            'version' => '1.1',
            'surface' => 'page',
            'type' => 'grapesjs-page',
            'components' => $this->convertComponents($components),
            'styles' => $this->parseStyles($styles),
            'metadata' => [
                'pages' => count($pages),
                'components_count' => count($components),
                'exported_at' => now()->toIso8601String(),
            ],
        ];
    }

    /**
     * Convert internal spec to GrapesJS editable format
     */
    public function toGrapesJsFormat(array $internalSpec): array
    {
        $components = $internalSpec['components'] ?? [];
        $styles = $internalSpec['styles'] ?? [];

        return [
            'gjs-components' => $this->convertToGrapesComponents($components),
            'gjs-css' => $this->stylesToCss($styles),
            'gjs-html' => $this->componentsToHtml($components),
            'gjs-data' => [
                'pages' => [
                    [
                        'id' => 'page-1',
                        'name' => 'Page 1',
                        'component' => [
                            'components' => $this->convertToGrapesComponents($components),
                        ],
                    ],
                ],
                'assets' => [],
                'styles' => $this->stylesToGrapesJs($styles),
            ],
        ];
    }

    /**
     * Generate block library for GrapesJS from widgets
     */
    public function getBlockLibrary(array $widgets): array
    {
        $blocks = [];

        foreach ($widgets as $widget) {
            $id = $widget['id'] ?? '';
            $name = $widget['name'] ?? '';
            $category = $widget['category'] ?? 'default';

            $blocks[] = [
                'id' => $id,
                'label' => $name,
                'category' => $category,
                'content' => [
                    'type' => 'widget',
                    'widgetId' => $id,
                    'attributes' => [
                        'data-gjs-type' => 'widget',
                        'data-widget-id' => $id,
                    ],
                ],
                'icon' => '<i class="' . ($widget['icon'] ?? 'icon-' . $id) . '"></i>',
            ];
        }

        return $blocks;
    }

    /**
     * Convert internal components array to GrapesJS format
     */
    private function convertComponents(array $components): array
    {
        $converted = [];
        foreach ($components as $component) {
            $converted[] = [
                'id' => $component['id'] ?? uniqid('comp-'),
                'component' => $component['type'] ?? 'div',
                'content' => $component['content'] ?? '',
                'attributes' => $component['attributes'] ?? [],
                'children' => isset($component['components']) 
                    ? $this->convertComponents($component['components']) 
                    : [],
            ];
        }
        return $converted;
    }

    /**
     * Convert components to GrapesJS format
     */
    private function convertToGrapesComponents(array $components): array
    {
        $converted = [];
        foreach ($components as $component) {
            $converted[] = [
                'id' => $component['id'] ?? uniqid('comp-'),
                'type' => $component['component'] ?? 'div',
                'content' => $component['content'] ?? '',
                'attributes' => $component['attributes'] ?? [],
                'components' => isset($component['children']) && !empty($component['children'])
                    ? $this->convertToGrapesComponents($component['children'])
                    : [],
            ];
        }
        return $converted;
    }

    /**
     * Parse CSS string into style object
     */
    private function parseStyles(string $css): array
    {
        $styles = [];
        preg_match_all('/\.([a-zA-Z0-9-_]+)\s*\{([^}]+)\}/i', $css, $matches, PREG_SET_ORDER);
        foreach ($matches as $match) {
            $className = $match[1];
            $declarations = $match[2];
            $props = [];
            preg_match_all('/([a-zA-Z-]+)\s*:\s*([^;]+);?/i', $declarations, $propMatches, PREG_SET_ORDER);
            foreach ($propMatches as $propMatch) {
                $props[trim($propMatch[1])] = trim($propMatch[2]);
            }
            $styles[$className] = $props;
        }
        return $styles;
    }

    /**
     * Convert style array to CSS string
     */
    private function stylesToCss(array $styles): string
    {
        $css = '';
        foreach ($styles as $className => $props) {
            $css .= ".$className {\n";
            foreach ($props as $property => $value) {
                $css .= "  $property: $value;\n";
            }
            $css .= "}\n";
        }
        return $css;
    }

    /**
     * Convert styles to GrapesJS format
     */
    private function stylesToGrapesJs(array $styles): array
    {
        $grapesStyles = [];
        foreach ($styles as $className => $props) {
            $grapesStyles[] = [
                'selectors' => [$className],
                'style' => $props,
            ];
        }
        return $grapesStyles;
    }

    /**
     * Convert components to HTML
     */
    private function componentsToHtml(array $components): string
    {
        $html = '';
        foreach ($components as $component) {
            $tag = $component['component'] ?? 'div';
            $content = $component['content'] ?? '';
            $attributes = $component['attributes'] ?? [];
            
            $attrStr = '';
            foreach ($attributes as $key => $value) {
                $attrStr .= " $key=\"" . htmlspecialchars($value, ENT_QUOTES) . "\"";
            }

            $html .= "<$tag$attrStr>" . $content;
            if (!empty($component['children'])) {
                $html .= $this->componentsToHtml($component['children']);
            }
            $html .= "</$tag>";
        }
        return $html;
    }

    /**
     * Validate GrapesJS data structure
     */
    public function validateGrapesJsData(array $data): array
    {
        $errors = [];

        if (empty($data['components']) && empty($data['pages'])) {
            $errors[] = 'No components or pages found';
        }

        if (isset($data['css']) && !is_string($data['css'])) {
            $errors[] = 'CSS must be a string';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}
