<?php
$provider = file_get_contents(__DIR__ . '/../../System/InteractionEngineServiceProvider.php');
$required = [
    "'titan.apps.interaction'",
    "'titan.apps.intelligence-routing'",
    "'titan.apps.interface-contributions'",
];
foreach ($required as $key) {
    if (!str_contains($provider, $key)) {
        fwrite(STDERR, "missing stable public service key: {$key}\n");
        exit(1);
    }
}
echo "PASS package-location independent public service keys\n";
