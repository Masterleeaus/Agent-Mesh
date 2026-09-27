<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = [];
$settings = file_get_contents($root.'/System/Management/BuilderSettingsRepository.php');
$admin = file_get_contents($root.'/System/Http/Controllers/Management/AdminManagementController.php');
$company = file_get_contents($root.'/System/Http/Controllers/Management/CompanyManagementController.php');
$settingsController = file_get_contents($root.'/System/Http/Controllers/Management/ManagementSettingsController.php');
$web = file_get_contents($root.'/routes/web.php');
$js = file_get_contents($root.'/resources/assets/js/titan-builder-management.js');

foreach (["'company:'.\$companyId", "where('company_id', \$companyId)", "whereNull('company_id')", "'scope' => 'platform'", "'scope' => 'company'"] as $needle) {
    if (! str_contains($settings, $needle)) $failures[] = 'settings scoping missing '.$needle;
}
if (! str_contains($admin, "require('builder.admin')")) $failures[] = 'admin controller does not require builder.admin';
if (! str_contains($settingsController, "require('builder.admin')")) $failures[] = 'admin settings mutation does not require builder.admin';
if (! str_contains($settingsController, "require('builder.edit')")) $failures[] = 'company settings mutation does not require builder.edit';
if (! str_contains($company, 'CompanyContext')) $failures[] = 'company management lacks CompanyContext';
if (preg_match('/tenant_id|forTenant|TenantContext|BelongsToTenant/', $settings.$admin.$company.$settingsController.$web)) $failures[] = 'legacy tenant fallback found';
foreach (['eval(', 'new Function(', 'document.write('] as $unsafe) if (str_contains($js, $unsafe)) $failures[] = 'unsafe management JS: '.$unsafe;
if (! str_contains($web, "['customer','field','owner','onboarding']")) $failures[] = 'four-surface route guard missing';

$projectController = file_get_contents($root.'/System/Http/Controllers/ProjectController.php');
$pageController = file_get_contents($root.'/System/Http/Controllers/PageController.php');
$assetController = file_get_contents($root.'/System/Http/Controllers/AssetController.php');
$previewController = file_get_contents($root.'/System/Http/Controllers/PreviewController.php');
$publishController = file_get_contents($root.'/System/Http/Controllers/PublishController.php');
foreach ([
    [$projectController, "require('builder.edit')", 'project mutation'],
    [$pageController, "require('builder.edit')", 'page mutation'],
    [$assetController, "require('builder.assets.manage')", 'asset mutation'],
    [$previewController, "require('builder.read')", 'preview'],
    [$publishController, "require('builder.publish')", 'publish/rollback'],
] as [$source, $needle, $label]) {
    if (! str_contains($source, $needle)) $failures[] = $label.' lacks explicit ability check';
}

if ($failures) { fwrite(STDERR, "Management security v0.9: FAIL\n - ".implode("\n - ",$failures)."\n"); exit(1); }
echo "Management security v0.9: PASS\n";
