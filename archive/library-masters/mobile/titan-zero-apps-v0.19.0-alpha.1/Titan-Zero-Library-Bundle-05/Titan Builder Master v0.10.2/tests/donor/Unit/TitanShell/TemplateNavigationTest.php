<?php

use App\Extensions\Chatbot\System\TitanShell\TemplateNavigation;

it('resolves operational navigation without assistant or settings destinations', function (): void {
    foreach (['titan-go', 'titan-hub', 'titan-zero', 'titan-quality'] as $slug) {
        $navigation = TemplateNavigation::resolve($slug);
        $labels = array_map(static fn (array $item): string => $item['label'], $navigation['primary']);
        expect($labels)->not->toContain('Assistant')->not->toContain('Chat')->not->toContain('Settings')->not->toContain('Help');
        expect($navigation['primary'])->toHaveCount(4);
    }
});
