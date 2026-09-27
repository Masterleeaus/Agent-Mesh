<?php

declare(strict_types=1);
$root = dirname(__DIR__, 2);
$gateway = file_get_contents($root.'/System/Provisioning/EloquentApplicationProvisioningGateway.php');
$required = ['titan-hub-home','titan-go-today','titan-command-home','titan-onboarding'];
$fail = [];
foreach ($required as $id) {
    if (! is_file($root.'/resources/builder/specs/'.$id.'.json')) { $fail[] = 'missing spec '.$id; }
    if (! is_file($root.'/resources/builder/pages/'.$id.'.json')) { $fail[] = 'missing page '.$id; }
}
if (! str_contains($gateway, 'seedDefaultPage(')) { $fail[] = 'gateway does not seed default page'; }
if (! str_contains($gateway, "'theme' => 'mobilekit-premium'")) { $fail[] = 'default theme not assigned'; }
if ($fail !== []) { fwrite(STDERR, "Provisioning defaults FAILED:\n - ".implode("\n - ", $fail)."\n"); exit(1); }
echo "Provisioning defaults PASS\n";
