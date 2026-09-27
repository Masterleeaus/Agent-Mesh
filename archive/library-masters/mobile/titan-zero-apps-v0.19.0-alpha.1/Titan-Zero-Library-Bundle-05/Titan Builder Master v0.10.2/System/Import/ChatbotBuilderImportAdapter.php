<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Import;

/**
 * Explicit compatibility adapter for caller-supplied legacy Chatbot builder data.
 * It never queries donor tables and is intentionally not invoked by the provider.
 */
final class ChatbotBuilderImportAdapter
{
    public function transform(array $legacy, int $companyId): array
    {
        $template = is_string($legacy['titan_template'] ?? null) ? $legacy['titan_template'] : 'titan-owner';
        $config = is_array($legacy['shell_builder_config'] ?? null) ? $legacy['shell_builder_config'] : [];
        return [
            'project' => [
                'company_id' => $companyId,
                'name' => (string) ($legacy['name'] ?? 'Imported Builder Project'),
                'slug' => (string) ($legacy['slug'] ?? ('imported-'.substr(hash('sha256', json_encode($legacy)), 0, 12))),
                'surface' => $this->surfaceFromTemplate($template),
                'meta' => [
                    'source' => 'chatbot-builder-import',
                    'legacy_template' => $template,
                    'legacy_shell_config' => $config,
                ],
            ],
            'requires_review' => true,
            'notes' => ['Legacy data was transformed only. Persist through company-scoped Titan Builder repositories after review.'],
        ];
    }

    private function surfaceFromTemplate(string $template): string
    {
        return match ($template) {
            'titan-go', 'titan-dispatch' => 'field',
            'titan-hub', 'titan-customer' => 'customer',
            default => 'owner',
        };
    }
}
