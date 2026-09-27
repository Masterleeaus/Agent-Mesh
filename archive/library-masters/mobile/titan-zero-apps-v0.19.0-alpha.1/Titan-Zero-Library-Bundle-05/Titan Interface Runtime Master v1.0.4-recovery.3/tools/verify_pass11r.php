<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\TitanInterfaceRuntime\\';
    if (! str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $path = $root . '/' . str_replace('\\', '/', $relative) . '.php';
    if (is_file($path)) require_once $path;
});

use App\Extensions\TitanInterfaceRuntime\System\Context\InterfaceContext;
use App\Extensions\TitanInterfaceRuntime\System\Discovery\InterfaceContributionValidator;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryActionRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Registry\InMemoryObjectRegistry;
use App\Extensions\TitanInterfaceRuntime\System\Host\TitanHostAuthorizationAdapter;

function expect11r(bool $condition, string $message): void {
    if (! $condition) throw new RuntimeException($message);
}

$base = [
    'schema_version'=>'1.1','extension_key'=>'crm',
    'context'=>['required'=>['company_id','user_id','product_surface','domain'],'optional'=>[]],
    'domains'=>[['key'=>'customers','label'=>'Customers','layer'=>'business','product_surfaces'=>['command','hub'],'intent_surfaces'=>['home','work','do','data'],'object_refs'=>['crm.customer','crm.job'],'default_view_refs'=>[]]],
    'objects'=>[
        ['key'=>'crm.customer','label'=>'Customer','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>['crm.customer.view'],'lifecycle_ref'=>null,'facet_refs'=>[],'view_refs'=>[],'action_refs'=>['crm.customer.edit','crm.customer.portal'],'relationship_refs'=>['crm.customer.jobs'],'offline_mode'=>'read-only'],
        ['key'=>'crm.job','label'=>'Job','data_authority'=>'crm','scope'=>['type'=>'tenant','tenant_key'=>'company_id'],'product_surfaces'=>['command','hub'],'customer_safe'=>true,'permissions'=>['crm.job.view'],'lifecycle_ref'=>null,'facet_refs'=>[],'view_refs'=>[],'action_refs'=>[],'relationship_refs'=>[],'offline_mode'=>'read-only'],
    ],
    'facets'=>[],'views'=>[],
    'actions'=>[
        ['key'=>'crm.customer.edit','label'=>'Edit','applies_to'=>['crm.customer'],'mutating'=>true,'capability_ref'=>'crm.customer.update','interaction'=>null,'product_surfaces'=>['command'],'permissions'=>['crm.customer.update'],'offline_mode'=>'online-required','requires_confirmation'=>true,'container_hint'=>'drawer','customer_safe'=>false],
        ['key'=>'crm.customer.portal','label'=>'Portal action','applies_to'=>['crm.customer'],'mutating'=>false,'capability_ref'=>null,'interaction'=>null,'product_surfaces'=>['command','hub'],'permissions'=>['crm.customer.view'],'offline_mode'=>'local-safe','requires_confirmation'=>false,'container_hint'=>'panel','customer_safe'=>true],
    ],
    'relationships'=>[
        ['key'=>'crm.customer.jobs','label'=>'Jobs','source_object_ref'=>'crm.customer','target_object_ref'=>'crm.job','kind'=>'one-to-many','inverse_ref'=>null,'customer_safe'=>true],
    ],
    'lifecycles'=>[],'global_work'=>[],
    'providers'=>['attention'=>[],'decisions'=>[],'insights'=>[]],
    'legacy_data_surfaces'=>[],
];

$validator = new InterfaceContributionValidator();
$validation = $validator->validate($base, 'crm');
expect11r($validation->valid(), 'v1.1 contribution must validate: '.implode('; ', $validation->errors));

$objects = new InMemoryObjectRegistry();
$snapshot = $objects->rebuild(['crm'=>['descriptor'=>$base]]);
expect11r(isset($snapshot->relationships['crm.customer.jobs']), 'typed relationship key missing');
$relationship = $snapshot->relationships['crm.customer.jobs'];
expect11r($relationship->sourceObjectKey === 'crm.customer', 'typed relationship source mismatch');
expect11r($relationship->targetObjectKey === 'crm.job', 'typed relationship target mismatch');
expect11r($relationship->kind === 'one-to-many', 'typed relationship kind mismatch');
expect11r($relationship->customerSafe === true, 'typed relationship customer safety mismatch');

$actions = new InMemoryActionRegistry($objects);
$actions->rebuild(['crm'=>['descriptor'=>$base]]);
$hub = new InterfaceContext(7, 11, 'hub', 'customers', capabilities:['crm.customer.view','crm.customer.update']);
$hubActions = $actions->forObject('crm.customer', $hub);
expect11r(! isset($hubActions['crm.customer.edit']), 'unsafe action must never be exposed on Hub');
expect11r(isset($hubActions['crm.customer.portal']), 'customer-safe Hub action missing');

final class SuperActor {
    public function isSuperAdmin(): bool { return true; }
    public function isAdmin(): bool { return true; }
    public function can(string $permission): bool { return false; }
}
final class DelegatedActor {
    public function isSuperAdmin(): bool { return false; }
    public function isAdmin(): bool { return true; }
    public function checkPermission(string $permission): bool { return $permission === 'interface.view'; }
    public function can(string $permission): bool { return false; }
}
final class UserActor {
    public function isSuperAdmin(): bool { return false; }
    public function isAdmin(): bool { return false; }
    public function hasPermissionTo(string $permission): bool { return $permission === 'interface.view'; }
}
$auth = new TitanHostAuthorizationAdapter();
expect11r($auth->allows(new SuperActor(), 'anything'), 'Super Admin bypass missing');
expect11r($auth->allows(new DelegatedActor(), 'interface.view'), 'delegated Admin bounded permission missing');
expect11r(! $auth->allows(new DelegatedActor(), 'interface.delete'), 'delegated Admin must not receive unbounded bypass');
expect11r($auth->allows(new UserActor(), 'interface.view'), 'ordinary user explicit permission missing');
expect11r(! $auth->allows(new UserActor(), 'interface.delete'), 'ordinary user must be denied without explicit permission');

$manifest = json_decode((string) file_get_contents($root.'/extension.manifest.json'), true, 512, JSON_THROW_ON_ERROR);
expect11r(($manifest['schema_version'] ?? null) === '2.2', 'production manifest must be canonical 2.2');
expect11r(($manifest['architecture']['profile'] ?? null) === 'ui-surface', 'architecture profile must be ui-surface');
expect11r(($manifest['architecture']['production_core'] ?? null) === 'titan.production.core.v1', 'production core inheritance missing');
expect11r(($manifest['interface_contribution']['contract_version'] ?? null) === '1.1', 'preferred interface contract must be 1.1');

$installer = json_decode((string) file_get_contents($root.'/extension.json'), true, 512, JSON_THROW_ON_ERROR);
$requiredInstaller = ['schema','slug','folder','provider','version','integrity'];
foreach ($requiredInstaller as $requiredKey) {
    expect11r(array_key_exists($requiredKey, $installer), 'root installer manifest missing required field '.$requiredKey);
}
expect11r(($installer['schema'] ?? null) === 'titan-extension-v1', 'root installer schema mismatch');

if (! function_exists('app_path')) { function app_path(string $path=''): string { return '/tmp/app'.($path!==''?'/'.$path:''); } }
$config = require $root.'/config/titan-interface-runtime.php';
expect11r(in_array('1.0', $config['discovery']['supported_contract_versions'] ?? [], true), 'v1.0 compatibility missing');
expect11r(in_array('1.1', $config['discovery']['supported_contract_versions'] ?? [], true), 'v1.1 support missing');

$routes = (string) file_get_contents($root.'/routes/admin.php');
expect11r(str_contains($routes, "name('liveness')"), 'liveness route missing');
expect11r(str_contains($routes, "name('readiness')"), 'readiness route missing');

$menuAdapter = $root.'/System/Host/TitanHostMenuCompatibilityAdapter.php';
expect11r(is_file($menuAdapter), 'host menu compatibility adapter missing');

$cert = $root.'/HOST-CERTIFICATION.json';
expect11r(is_file($cert), 'host certification report missing');

echo "PASS 11R VERIFY: Blueprint v2.2 + interface v1.1 + typed relationships + Hub action safety + host compatibility\n";
