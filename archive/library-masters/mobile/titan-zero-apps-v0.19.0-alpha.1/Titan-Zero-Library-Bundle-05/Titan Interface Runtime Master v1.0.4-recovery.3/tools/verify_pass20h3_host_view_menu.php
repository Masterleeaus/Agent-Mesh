<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$errors = [];

$view = file_get_contents($root . '/resources/views/index.blade.php');
if (!is_string($view)) $errors[] = 'index view missing';
else {
    if (!str_contains($view, "@extends('panel.layout.app')")) $errors[] = 'index view must extend panel.layout.app';
    if (!str_contains($view, "@section('content')")) $errors[] = 'index view must define content section';
    if (str_contains($view, '<x-layouts.app>') || str_contains($view, '</x-layouts.app>')) $errors[] = 'index view still uses unsupported layouts.app component';
    foreach (['Explore','Command Surface','Object Workspaces','Collections','Spatial','Decisions','Governance','Working Sets','Configuration','Product Surfaces'] as $label) if (!str_contains($view, $label)) $errors[] = "overview missing full-menu shortcut {$label}";
}

$menu = file_get_contents($root . '/System/Host/TitanInterfaceRuntimeMenuContributor.php');
if (!is_string($menu)) $errors[] = 'menu contributor missing';
else {
    foreach ([
        'titan_interface_runtime_overview',
        'titan_interface_runtime_explore',
        'titan_interface_runtime_commands',
        'titan_interface_runtime_continue',
        'titan_interface_runtime_attention',
        'titan_interface_runtime_approvals',
        'titan_interface_runtime_inbox',
        'titan_interface_runtime_sync',
        'titan_interface_runtime_workspaces',
        'titan_interface_runtime_collections',
        'titan_interface_runtime_spatial',
        'titan_interface_runtime_decisions',
        'titan_interface_runtime_governance',
        'titan_interface_runtime_working_sets',
        'titan_interface_runtime_configuration',
        'titan_interface_runtime_experience',
        'titan_interface_runtime_surfaces',
    ] as $key) {
        if (!str_contains($menu, $key)) $errors[] = "menu contributor missing {$key}";
    }
    if (!str_contains($menu, 'self::item(self::USER_PARENT')) $errors[] = 'menu children must declare USER_PARENT';
    if (!str_contains($menu, "dashboard.user.titan.interface.runtime.menu.page")) $errors[] = 'menu children must use host UI menu.page route';
}

$routes = file_get_contents($root . '/routes/user.php');
if (!is_string($routes) || !str_contains($routes, "->name('menu.page')")) $errors[] = 'host UI menu.page route missing';
if (is_string($routes) && !str_contains($routes, 'workspaces|collections|spatial|decisions|governance|working-sets|configuration')) $errors[] = 'menu.page route must expose all major runtime landing pages';

$controller = $root . '/System/Http/Controllers/RuntimeMenuPageController.php';
if (!is_file($controller)) $errors[] = 'RuntimeMenuPageController missing';
$menuView = $root . '/resources/views/menu-page.blade.php';
if (!is_file($menuView)) $errors[] = 'menu-page Blade view missing';
elseif (($content = file_get_contents($menuView)) !== false) {
    if (!str_contains($content, "@extends('panel.layout.app')")) $errors[] = 'menu page must use panel.layout.app';
    if (preg_match('/<x-layouts\.app>/', $content)) $errors[] = 'menu page must not use layouts.app';
}

$adapter = file_get_contents($root . '/System/Host/TitanHostMenuCompatibilityAdapter.php');
if (!is_string($adapter)) $errors[] = 'menu adapter missing';
else {
    if (!str_contains($adapter, 'TitanInterfaceRuntimeMenuContributor::definitions()')) $errors[] = 'legacy menu sync must consume full menu hierarchy';
    if (!str_contains($adapter, "'parent_key'")) $errors[] = 'legacy menu sync must map parent_key to parent_id';
    if (!str_contains($adapter, 'keys()')) $errors[] = 'uninstall must remove all extension-owned menu keys';
}

if ($errors !== []) {
    fwrite(STDERR, "Pass20-H3 host view/menu verification FAILED\n - " . implode("\n - ", $errors) . "\n");
    exit(1);
}

echo "Pass20-H3 host view/menu verification PASS\n";
