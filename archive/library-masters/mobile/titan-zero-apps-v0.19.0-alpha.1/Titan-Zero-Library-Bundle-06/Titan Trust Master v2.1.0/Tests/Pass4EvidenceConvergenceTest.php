<?php

declare(strict_types=1);

$root = dirname(__DIR__);
$package = dirname(dirname($root));
$failures = [];
function p4(bool $ok, string $label): void { global $failures; echo ($ok ? 'PASS: ' : 'FAIL: ') . $label . "\n"; if (!$ok) $failures[]=$label; }
function text(string $path): string { return is_file($path) ? (string) file_get_contents($path) : ''; }
function phpFiles(string $root): array { $out=[]; if (!is_dir($root)) return $out; $it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)); foreach($it as $f) if($f->isFile() && str_ends_with($f->getFilename(),'.php')) $out[]=$f->getPathname(); return $out; }

p4(!is_dir($root . '/TitanTrust'), 'nested duplicate TitanTrust tree removed from active runtime');
p4(is_file($package . '/LegacyDonors/TitanTrust-Nested-Pass3-Source.zip'), 'nested TitanTrust donor preserved as archive');

$runtime=''; foreach(phpFiles($root) as $file) { if (str_contains(str_replace('\\','/',$file), '/Tests/') || str_starts_with(basename($file), 'VERIFY_PASS')) continue; $runtime .= text($file); }
p4(!str_contains($runtime, '$0'), 'corrupted $0 placeholders removed');
p4(!str_contains($runtime, ' to capture mode'), 'corrupted incident prose removed');
p4(!preg_match('/company[_ ]?id\s*\?\?\s*\$?(?:user|userId)/i', $runtime), 'no user-id-as-company fallback remains');
p4(!str_contains($runtime, 'company_id'), 'canonical company_id boundary retained');

$tenant=text($root.'/System/Models/Concerns/TenantScoped.php');
p4(str_contains($tenant, 'ExecutionContextStore'), 'TitanTrust model scope uses Titan Zero company execution context resolver');
p4(str_contains($tenant, "'.company_id'"), 'model scope applies company_id boundary');
p4(!str_contains($tenant, "'.user_id'"), 'company boundary is not incorrectly reduced to current user ownership');
p4(!str_contains(text($root.'/System/Services/EvidenceReadiness.php'), "->where('user_id', \$userId)"), 'evidence readiness is company-scoped rather than uploader-scoped');
p4(str_contains(text($root.'/System/Services/EvidenceReadiness.php'), "selectRaw('evidence_type, COUNT(*) as c')"), 'evidence readiness uses canonical evidence_type column');

$mapper=text($root.'/System/Assurance/EvidenceRefFactory.php');
p4(str_contains($mapper, 'Modules\\TitanZeroAssurance\\ValueObjects\\EvidenceRef'), 'TitanTrust maps evidence into canonical EvidenceRef');
p4(str_contains($mapper, "'job_id'") && str_contains($mapper, "'file_id'") && str_contains($mapper, "'sha256'"), 'evidence mapping retains job/file/hash provenance');
p4(str_contains($mapper, 'fromSignoff') && str_contains($mapper, 'fromIncident') && str_contains($mapper, 'fromAttendance'), 'signoff incident and presence map to canonical evidence');

$capture=text($root.'/System/Http/Controllers/CaptureController.php');
$evidence=text($root.'/System/Http/Controllers/EvidenceController.php');
p4(str_contains($capture, "WorkEvidenceItem::query()->create") && str_contains($evidence, "WorkEvidenceItem::query()->create"), 'uploads create canonical evidence items as well as files');
p4(str_contains($capture, 'EvidenceRefFactory::fromItem') && str_contains($evidence, 'EvidenceRefFactory::fromItem'), 'capture/upload paths emit canonical EvidenceRef mappings');

$signoff=text($root.'/System/Http/Controllers/SignoffController.php');
p4(str_contains($signoff, 'withoutGlobalScope') && str_contains($signoff, "where('token', \$token)"), 'public signoff uses explicit token lookup independent of authenticated global scope');
p4(str_contains($signoff, 'EvidenceRefFactory::fromSignoff'), 'signed client proof maps to canonical EvidenceRef');

$incident=text($root.'/System/Http/Controllers/IncidentController.php');
p4(str_contains($incident, 'EvidenceRefFactory::fromIncident'), 'incident lifecycle maps to canonical EvidenceRef');
$presence=text($root.'/System/Http/Controllers/PresenceController.php');
p4(str_contains($presence, 'EvidenceRefFactory::fromAttendance'), 'presence lifecycle maps to canonical EvidenceRef');

$provider=text($root.'/System/TitanTrustServiceProvider.php');
p4(str_contains($provider, "loadRoutesFrom(__DIR__ . '/../routes/web.php')"), 'legacy job timeline/review routes are explicitly loaded');
p4(str_contains($provider, "'prefix' => 'dashboard/user/titan-trust'") && str_contains($provider, "'as' => 'dashboard.user.titan-trust.'"), 'TitanTrust route prefix and names match manifest compatibility contract');

$extension=json_decode(text($root.'/extension.json'), true);
p4(is_array($extension) && ($extension['version'] ?? '') === '2.1.0', 'TitanTrust manifest version advanced to 2.1.0');
p4(($extension['canonical_domain'] ?? '') === 'evidence_assurance', 'TitanTrust declares canonical evidence_assurance domain');

if ($failures) { echo 'PASS4_TEST: FAIL (' . count($failures) . ")\n"; exit(1); }
echo "PASS4_TEST: PASS\n";
