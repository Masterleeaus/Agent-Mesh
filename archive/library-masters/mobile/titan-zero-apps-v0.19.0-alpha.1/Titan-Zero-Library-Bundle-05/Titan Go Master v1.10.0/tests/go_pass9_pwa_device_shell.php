<?php
declare(strict_types=1);
$root=dirname(__DIR__);$n=0;$ok=function(bool $v,string $m)use(&$n){if(!$v)throw new RuntimeException($m);$n++;};
$bootstrap=(string)file_get_contents($root.'/System/Runtime/GoBootstrap.php');
$runtime=(string)file_get_contents($root.'/System/Runtime/GoSuiteRuntime.php');
$routes=(string)file_get_contents($root.'/routes/web.php');
$shell=(string)file_get_contents($root.'/resources/views/go/shell.blade.php');
$js=(string)file_get_contents($root.'/resources/js/go-shell.js');
$manifest=json_decode((string)file_get_contents($root.'/extension.json'),true);
$ok(($manifest['version']??'')==='1.10.0','version');
$ok(str_contains($bootstrap,'AppPwaLifecycle'),'Core PWA lifecycle injected');
$ok(str_contains($bootstrap,'AppSurface::Go'),'Core PWA policy resolved for Go');
$ok(str_contains($runtime,"'core.pwa_lifecycle' => AppPwaLifecycle::class"),'PWA lifecycle is a required suite binding');
$ok(str_contains($routes,'/runtime/client.js'),'static Go client route present');
$ok(str_contains($shell,"route('go.runtime.client')"),'shell loads Go client');
$ok(str_contains($shell,'titan-go-runtime-status'),'runtime status is rendered');
$ok(str_contains($js,"company_boundary: 'company_id'"),'device state names company_id as sole boundary');
foreach(['tenant_id','tenant_company_id','access_token','provider_credentials','permissions'] as $forbidden){$ok(!str_contains(strtolower($js),$forbidden),'client does not persist '.$forbidden);}
$ok(str_contains($js,'localStorage.setItem'),'non-sensitive shell state is locally cached');
$ok(str_contains($js,'navigator.onLine'),'connectivity state handled');
$ok(!str_contains($js,'serviceWorker.register'),'Go does not create a competing service worker');
$ok(!str_contains($js,'fetch('),'Go shell runtime does not bypass governed runtime/provider contracts');
echo "go_pass9_pwa_device_shell: PASS {$n}/{$n}\n";
