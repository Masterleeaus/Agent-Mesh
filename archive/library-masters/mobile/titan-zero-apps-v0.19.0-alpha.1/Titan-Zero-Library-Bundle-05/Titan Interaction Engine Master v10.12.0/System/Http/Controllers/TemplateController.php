<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry;
use App\Extensions\InteractionEngine\System\Template\TemplateCompatibilityChecker;
use App\Extensions\InteractionEngine\System\Template\TemplateDefinition;
use App\Extensions\InteractionEngine\System\Template\TemplateRegistry;

final class TemplateController
{
    public function __construct(
        private readonly TemplateRegistry $templates,
        private readonly TemplateCompatibilityChecker $compatibility,
        private readonly CapabilityRegistry $capabilities,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $status = $request->string('status')->toString();
        $category = $request->string('category')->toString();
        $items = array_values(array_filter(
            $this->templates->all(),
            static fn(TemplateDefinition $template): bool =>
                ($status === '' || $template->status === $status)
                && ($category === '' || $template->category === $category),
        ));

        return response()->json([
            'templates' => array_map(fn(TemplateDefinition $template): array => $this->serialize($template), $items),
            'count' => count($items),
        ]);
    }

    public function show(string $templateId): JsonResponse
    {
        if (!$this->templates->has($templateId)) {
            return response()->json(['message' => "Template '{$templateId}' was not found."], 404);
        }

        return response()->json(['template' => $this->serialize($this->templates->get($templateId))]);
    }

    private function serialize(TemplateDefinition $template): array
    {
        $available = array_values(array_filter(
            $template->capabilities,
            fn(string $capability): bool => $this->capabilities->has($capability),
        ));
        $report = $this->compatibility->check($template, $available);

        return array_merge($template->toArray(), ['compatibility' => $report->toArray()]);
    }
}
