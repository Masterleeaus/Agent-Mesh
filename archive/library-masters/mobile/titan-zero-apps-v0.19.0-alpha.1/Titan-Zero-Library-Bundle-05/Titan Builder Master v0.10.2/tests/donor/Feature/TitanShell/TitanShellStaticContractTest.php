<?php

it('renders the template-aware shell controls', function (): void {
    $root = dirname(__DIR__, 3);
    $header = file_get_contents($root.'/resources/views/frontend-ui/components/header.blade.php');
    $nav = file_get_contents($root.'/resources/views/frontend-ui/components/app-shell-navigation.blade.php');
    expect($header)->toContain('openTitanDrawer')->toContain('openTitanSettings')->toContain('openTitanChat');
    expect($nav)->not->toContain("__('Assistant')")->not->toContain("__('Chat')")->not->toContain("__('Settings')")->not->toContain("__('Help')");
});
