<?php

declare(strict_types=1);
$root = dirname(__DIR__, 2);
$activeRoots = [$root.'/System', $root.'/routes', $root.'/config', $root.'/resources/builder'];
$bad = [];
foreach ($activeRoots as $base) {
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if (! $file->isFile()) continue;
        $relative = substr($file->getPathname(), strlen($root)+1);
        $text = file_get_contents($file->getPathname()) ?: '';
        if (str_contains($text, 'App\\Extensions\\Chatbot\\') || str_contains($text, "config('chatbot.")) { $bad[] = $relative; }
        if (preg_match('/chatbot.{0,30}(knowledge|persona)|(?:knowledge|persona).{0,30}chatbot/i', $text)) { $bad[] = $relative.':authority'; }
    }
}
if ($bad !== []) { throw new RuntimeException('Chatbot boundary violation: '.implode(', ', array_unique($bad))); }
$gateway = file_get_contents($root.'/System/Provisioning/EloquentApplicationProvisioningGateway.php') ?: '';
if (! str_contains($gateway, 'chatbot_reference')) { throw new RuntimeException('Builder lost opaque Chatbot presentation reference support.'); }
if (! is_dir($root.'/donor/chatbot-coupled')) { throw new RuntimeException('Donor provenance unexpectedly removed.'); }

echo "Chatbot Builder separation PASS\n";
