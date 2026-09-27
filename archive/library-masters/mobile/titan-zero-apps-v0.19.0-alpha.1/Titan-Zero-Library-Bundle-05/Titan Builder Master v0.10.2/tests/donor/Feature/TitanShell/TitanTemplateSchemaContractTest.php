<?php

it('ships a complete schema for all fourteen Titan apps', function (): void {
    $dir = dirname(__DIR__, 3) . '/resources/titan-apps/TemplateSchemas';
    $files = glob($dir . '/titan-*.json') ?: [];
    expect($files)->toHaveCount(14);
    foreach ($files as $file) {
        $schema = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
        expect($schema)->toHaveKeys(['identity','navigation','home','chat','workcore','offline','permissions','privacy','notifications','settings_sections','preview_states']);
        expect($schema['navigation']['primary'])->toHaveCount(4);
        expect($schema['chat']['context_policy']['send_full_record'])->toBeFalse();
        expect($schema['offline']['conflict_rules']['server_authoritative'])->toBeTrue();
    }
});
