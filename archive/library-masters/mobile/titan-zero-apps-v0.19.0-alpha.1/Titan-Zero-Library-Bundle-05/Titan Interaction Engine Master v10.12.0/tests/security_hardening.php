<?php

declare(strict_types=1);

$root = dirname(__DIR__);
spl_autoload_register(static function (string $class) use ($root): void {
    $prefix = 'App\\Extensions\\InteractionEngine\\System\\';
    if (!str_starts_with($class, $prefix)) return;
    $path = $root . '/System/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($path)) require_once $path;
});

$tests = [];
$test = static function (string $name, callable $fn) use (&$tests): void { $tests[$name] = $fn; };
$assert = static function (bool $condition, string $message = 'Assertion failed'): void {
    if (!$condition) throw new RuntimeException($message);
};

$test('production wizard outbox has a persistent store abstraction', function () use ($root, $assert): void {
    $assert(is_file($root . '/System/Wizard/Offline/WizardOutboxStoreInterface.php'), 'Persistent wizard outbox store interface is missing.');
    $assert(is_file($root . '/System/Wizard/Offline/DatabaseWizardOutboxStore.php'), 'Database-backed wizard outbox store is missing.');
    $provider = file_get_contents($root . '/System/InteractionEngineServiceProvider.php') ?: '';
    $assert(str_contains($provider, 'DatabaseWizardOutboxStore'), 'Production provider must wire the durable wizard outbox store.');
});

$test('onboarding compiler rejects undeclared prefixed fields', function () use ($assert): void {
    $compiler = new App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlanCompiler();
    $plan = $compiler->compile('42', [
        'company.name' => 'Safe Co',
        'payments.bank_password' => 'must-not-survive',
        'payments.invoice_terms' => '7 days',
        'activation.go_live' => 'draft',
    ]);
    $encoded = json_encode($plan->toArray(), JSON_THROW_ON_ERROR);
    $assert(!str_contains($encoded, 'must-not-survive'), 'Undeclared prefixed fields must never survive plan compilation.');
    $assert(str_contains($encoded, '7 days'), 'Declared onboarding fields should remain.');
});

$test('compiled onboarding plans do not persist actor authority', function () use ($assert): void {
    $compiler = new App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlanCompiler();
    $plan = $compiler->compile('42', [
        'company.name' => 'Safe Co',
        'activation.go_live' => 'draft',
    ], 'p-auth', [
        'company_id' => '42', 'company_id' => '42', 'user_id' => 'compiler-user',
        'roles' => ['owner'], 'delegated_scopes' => ['*'], 'authenticated_at' => time(),
        'correlation_id' => 'corr-1',
    ]);
    $payload = $plan->actions[0]->payload['_context'] ?? [];
    foreach (['user_id','roles','delegated_scopes','authenticated_at'] as $key) {
        $assert(!array_key_exists($key, $payload), "Compiled plan must not persist actor authority field {$key}.");
    }
    $assert(($payload['company_id'] ?? null) === '42', 'Compiled plan must retain company boundary.');
});

$test('wizard context does not invent fresh authentication', function () use ($assert): void {
    $factory = new App\Extensions\InteractionEngine\System\Wizard\Context\WizardExecutionContextFactory();
    $user = ['id' => 7, 'company_id' => 42, 'roles' => ['owner']];
    $context = $factory->build($user);
    $assert(($context['authenticated_at'] ?? null) === null, 'Missing trusted re-authentication timestamp must remain null.');
    $trusted = $factory->build($user, [], [], ['authenticated_at' => 123456]);
    $assert(($trusted['authenticated_at'] ?? null) === 123456, 'Trusted re-authentication timestamp must be preserved.');
});

$test('command mapper signs approval using trusted current actor rather than client approver fields', function () use ($assert): void {
    $registry = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $registry->register([
        'id' => 'approval_test', 'name' => 'Approval Test', 'capability' => 'quotes.create',
        'steps' => [['id' => 'approval', 'fields' => [['id' => 'approval_id']]]],
    ]);
    $session = new App\Extensions\InteractionEngine\System\Wizard\WizardSession(
        's1', $registry->get('approval_test'), 1,
        ['approval_id' => 'approval-1', 'approved_by' => 'spoofed-user', 'approved_at' => 'yesterday'],
        ['company_id' => '42', 'company_id' => '42', 'user_id' => 'real-owner', 'roles' => ['owner']]
    );
    $signer = new App\Extensions\InteractionEngine\System\Authority\ApprovalSigner('phase51-approval-secret');
    $mapper = new App\Extensions\InteractionEngine\System\Wizard\Command\CommandMapper($signer);
    $command = $mapper->map($session);
    $grant = (array) ($command['payload']['_approval'] ?? []);
    $assert($signer->verify($grant), 'Mapped approval must be cryptographically signed.');
    $assert(($grant['approved_by'] ?? null) === 'real-owner', 'Client supplied approver identity must not establish approval authority.');
    $assert(($grant['company_id'] ?? null) === '42', 'Approval grant must be company scoped.');
});

$test('wizard access policy enforces required roles before start or listing', function () use ($assert): void {
    $policy = new App\Extensions\InteractionEngine\System\Wizard\Security\WizardAccessPolicy();
    $registry = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $registry->register([
        'id' => 'restricted', 'name' => 'Restricted', 'capability' => 'jobs.create',
        'permissions' => ['required_roles' => ['owner','dispatcher']],
        'steps' => [['id' => 'one', 'fields' => []]],
    ]);
    $wizard = $registry->get('restricted');
    $assert($policy->mayAccess($wizard, ['company_id'=>'42','user_id'=>'1','roles'=>['owner']]), 'Owner should access restricted wizard.');
    $assert(!$policy->mayAccess($wizard, ['company_id'=>'42','user_id'=>'2','roles'=>['worker']]), 'Worker must not access restricted wizard.');
});

$test('onboarding execution is current-actor scoped idempotent and activation-gated', function () use ($assert): void {
    $providers=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry();$router=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter($providers,new App\Extensions\InteractionEngine\System\Capabilities\CapabilityAliasRegistry());$registry=new App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry($router);
    $registry->register('crm.business.profile.update', static fn(array $payload): array => ['ok'=>true]);$registry->register('interaction.onboarding.activate', static fn(array $payload): array => ['ok'=>true]);
    $bus=new class implements App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface{public array$dispatched=[];public function dispatch(string$c,array$p):void{$this->dispatched[]=[$c,$p];}public function registerHandler(string$c,callable$h):void{}public function hasHandler(string$c):bool{return true;}};
    $ledger=new App\Extensions\InteractionEngine\System\Onboarding\Storage\InMemoryOnboardingExecutionLedger();$signer=new App\Extensions\InteractionEngine\System\Authority\ApprovalSigner('phase51-onboarding-secret');
    $approvalStore=new class implements App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingApprovalStoreInterface{private array$g=[];public function put(string$c,string$p,string$a,array$grant,int$ttlSeconds=900):void{$this->g[$c.'|'.$p.'|'.$a]=$grant;}public function get(string$c,string$p,string$a):?array{return$this->g[$c.'|'.$p.'|'.$a]??null;}};
    $executor=new App\Extensions\InteractionEngine\System\Onboarding\OnboardingActionExecutor($registry,$bus,new App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext('42'),$ledger,null,$approvalStore);
    $plan=new App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlan('p1','42',[
        new App\Extensions\InteractionEngine\System\Onboarding\OnboardingAction('a1','company','crm.business.profile.update','section',false,['_context'=>['company_id'=>'42','user_id'=>'stale-user','roles'=>['owner']]],'crm'),
        new App\Extensions\InteractionEngine\System\Onboarding\OnboardingAction('a2','activation','interaction.onboarding.activate','critical',true,['_context'=>['company_id'=>'42','user_id'=>'stale-user','roles'=>['owner']]],'interaction',['a1'],1000),
    ],gmdate(DATE_ATOM));
    $current=['company_id'=>'42','company_id'=>'42','user_id'=>'current-owner','actor_type'=>'human','roles'=>['owner'],'authenticated_at'=>time()];$approvalStore->put('42','p1','a2',$signer->issue('interaction.onboarding.activate','42','current-owner',['owner'],600,'a2'),600);$first=$executor->execute($plan,[],$current)->toArray();
    $assert($first['summary']['executed']===2,'Successful setup followed by approved activation should execute both actions.');$assert(($bus->dispatched[0][1]['_context']['user_id']??null)==='current-owner','Executor must rebuild authority from current actor.');$assert(($bus->dispatched[1][1]['_approval']['approved_by']??null)==='current-owner','Approved action must use signed current-actor approval.');
    $second=$executor->execute($plan,[],$current)->toArray();$assert(($second['summary']['already_executed']??0)===2,'Repeated execution must not dispatch completed actions again.');$assert(count($bus->dispatched)===2,'Idempotent replay must not duplicate mutations.');
});

$test('activation is blocked while any prerequisite onboarding action is unavailable', function () use ($assert): void {
    $providers=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry();$providers->register(new App\Extensions\InteractionEngine\System\Capabilities\Providers\CrmCapabilityProvider());$router=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter($providers,new App\Extensions\InteractionEngine\System\Capabilities\CapabilityAliasRegistry());$registry=new App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry($router);$registry->register('interaction.onboarding.activate',static fn(array$p):array=>['ok'=>true]);
    $bus=new class implements App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface{public array$dispatched=[];public function dispatch(string$c,array$p):void{$this->dispatched[]=$c;}public function registerHandler(string$c,callable$h):void{}public function hasHandler(string$c):bool{return$c==='interaction.onboarding.activate';}};
    $executor=new App\Extensions\InteractionEngine\System\Onboarding\OnboardingActionExecutor($registry,$bus,new App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext('42'),new App\Extensions\InteractionEngine\System\Onboarding\Storage\InMemoryOnboardingExecutionLedger());
    $plan=new App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlan('p2','42',[
        new App\Extensions\InteractionEngine\System\Onboarding\OnboardingAction('a1','company','crm.business.profile.update','section',false,['_context'=>['company_id'=>'42']],'crm'),
        new App\Extensions\InteractionEngine\System\Onboarding\OnboardingAction('a2','activation','interaction.onboarding.activate','critical',true,['_context'=>['company_id'=>'42']],'interaction',['a1'],1000),
    ],gmdate(DATE_ATOM));$current=['company_id'=>'42','company_id'=>'42','user_id'=>'owner','actor_type'=>'human','roles'=>['owner'],'authenticated_at'=>time()];$result=$executor->execute($plan,[],$current)->toArray();
    $assert(($result['summary']['unavailable']??0)===1,'Unavailable prerequisite must be reported.');$assert(($result['summary']['blocked_dependency']??0)===1,'Activation must be blocked by incomplete prerequisites.');$assert($bus->dispatched===[],'Blocked activation must not dispatch.');
});

$test('sync engine replays durable encrypted wizard outbox for the current company', function () use ($assert): void {
    $plainQueue = new class implements App\Extensions\InteractionEngine\System\Contracts\OfflineQueueInterface {
        public function queue(string $companyId, string $capability, array $payload, array $metadata = []): void {}
        public function getPending(string $companyId): array { return []; }
        public function markSynced(string $companyId, int $id): void {}
        public function markFailed(string $companyId, int $id, string $error): void {}
        public function countPending(string $companyId): int { return 0; }
        public function countByStatus(string $companyId, string $status): int { return 0; }
        public function clear(string $companyId): void {}
    };
    $bus = new class implements App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface {
        public array $dispatched = [];
        public function registerHandler(string $capability, callable $handler): void {}
        public function hasHandler(string $capability): bool { return true; }
        public function dispatch(string $capability, array $payload): void { $this->dispatched[] = [$capability, $payload]; }
    };
    $events = new class implements App\Extensions\InteractionEngine\System\Contracts\EventRecorderInterface {
        public array $events = [];
        public function record(string $eventType, array $data): void { $this->events[] = [$eventType, $data]; }
        public function getEvents(int $runId): array { return []; }
    };
    $conflicts = new class implements App\Extensions\InteractionEngine\System\Contracts\ConflictResolverInterface {
        public function resolve(array $command): array { return ['conflict' => false, 'message' => '']; }
        public function resolveConflicts(array $commands): array { return $commands; }
    };
    $store = new App\Extensions\InteractionEngine\System\Wizard\Offline\InMemoryWizardOutboxStore();
    $outbox = new App\Extensions\InteractionEngine\System\Wizard\Offline\LocalCommandOutbox('phase51-outbox-secret', $store, '42');
    $outbox->enqueue([
        'id' => 'wizard-cmd-1',
        'capability' => 'jobs.create',
        'payload' => ['customer_id' => 'c1', '_context' => ['company_id' => '42', 'company_id' => '42']],
        'metadata' => ['company_id' => '42', 'company_id' => '42'],
    ]);
    $tenant = new App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext('42');
    $sync = new App\Extensions\InteractionEngine\System\Offline\SyncEngine($plainQueue, $bus, $events, $conflicts, $tenant, $outbox);
    $result = $sync->sync('42');
    $assert(($result['wizard_synced'] ?? 0) === 1, 'Encrypted wizard outbox command must be replayed.');
    $assert(count($bus->dispatched) === 1 && $bus->dispatched[0][0] === 'jobs.create', 'Wizard outbox replay must dispatch the original capability.');
    $assert($outbox->pending('42') === [], 'Successfully replayed wizard command must be marked synced.');
});

$test('sync HTTP controller resolves company from trusted company context', function () use ($root, $assert): void {
    $source = file_get_contents($root . '/System/Http/Controllers/SyncController.php') ?: '';
    $routes = file_get_contents($root . '/routes/api.php') ?: '';
    $assert(str_contains($source, 'CompanyExecutionContext'), 'Sync controller must use trusted company context.');
    $assert(str_contains($source, 'companyId()'), 'Sync controller must pass trusted company_id to sync engine.');
    $assert(str_contains($routes, '/sync'), 'Authenticated sync API route must be wired.');
});


$test('onboarding field branch conditions prevent irrelevant required fields', function () use ($root, $assert): void {
    $wizard = json_decode((string) file_get_contents($root . '/resources/wizards/field_home_services_onboarding.json'), true, 512, JSON_THROW_ON_ERROR)['wizard'];
    $step = $wizard['steps'][0];
    $validator = new App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine();
    $base = [];
    foreach ($step['fields'] as $field) {
        if (($field['required'] ?? false) && !in_array($field['id'], ['company.abn','company.gst_registered'], true)) {
            $base[$field['id']] = match ($field['type'] ?? 'text') {
                'email' => 'owner@example.test',
                'number' => 1,
                default => 'configured',
            };
        }
    }
    $base['company.country_code'] = 'NZ';
    $errors = $validator->validateStep($step, $base, []);
    $assert(!isset($errors['company.abn']) && !isset($errors['company.gst_registered']), 'Australian-only ABN/GST fields must not be required for non-AU companies.');
    $base['company.country_code'] = 'AU';
    $errors = $validator->validateStep($step, $base, []);
    $assert(isset($errors['company.abn']) && isset($errors['company.gst_registered']), 'ABN/GST must become required when the AU branch is active.');
});

$test('structured onboarding fields reject scalar payloads and hidden branch input is filtered', function () use ($assert): void {
    $validator = new App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine();
    $step = ['id'=>'structured','fields'=>[
        ['id'=>'availability.business_hours','type'=>'text','ui_type'=>'weekly_schedule','required'=>true],
        ['id'=>'territory.radius','type'=>'text','ui_type'=>'map_radius','required'=>false,'branch_condition'=>'territory.method includes radius'],
        ['id'=>'booking.completion_otp','type'=>'text','ui_type'=>'boolean','required'=>false],
    ]];
    $errors = $validator->validateStep($step, [
        'availability.business_hours'=>'not-an-array',
        'territory.method'=>'postcode',
        'territory.radius'=>['latitude'=>-37.8,'longitude'=>144.9,'radius_km'=>10],
        'booking.completion_otp'=>'yes',
    ]);
    $assert(isset($errors['availability.business_hours']), 'Weekly schedule must reject scalar input.');
    $assert(isset($errors['booking.completion_otp']), 'Boolean field must reject arbitrary string input.');
    $filtered = $validator->filterStepInput($step, [
        'availability.business_hours'=>['mon'=>['09:00','17:00']],
        'territory.radius'=>['latitude'=>-37.8,'longitude'=>144.9,'radius_km'=>10],
    ], ['territory.method'=>'postcode']);
    $assert(!isset($filtered['territory.radius']), 'Input for an inactive conditional field must not be persisted.');
});


$test('legacy customer interaction condition and required_if rules are executable', function () use ($assert): void {
    $conditions = new App\Extensions\InteractionEngine\System\Compiler\ConditionRegistry();
    $businessState = ['answers' => [['question_key'=>'customer_type','value'=>'business']]];
    $individualState = ['answers' => [['question_key'=>'customer_type','value'=>'individual']]];
    $assert($conditions->evaluate('isBusiness', $businessState), 'isBusiness condition must recognize business customer state.');
    $assert(!$conditions->evaluate('isBusiness', $individualState), 'isBusiness condition must reject individual customer state.');

    $validator = new App\Extensions\InteractionEngine\System\Validation\ValidationEngine();
    $question = new App\Extensions\InteractionEngine\System\DTO\Question(
        'company_name', 'Company name', 'text', validation: ['required_if'=>'customer_type:business']
    );
    $errors = $validator->validate($question, null, ['customer_type'=>'business']);
    $assert($errors !== [], 'required_if must require company_name for business customers.');
    $errors = $validator->validate($question, null, ['customer_type'=>'individual']);
    $assert($errors === [], 'required_if must not require company_name for individual customers.');
});

$test('legacy interaction runtime only marks completion after command acceptance', function () use ($root, $assert): void {
    $source = file_get_contents($root . '/System/Runtime/InteractionRuntime.php') ?: '';
    $execute = strpos($source, '$this->executeOrQueue($definition->capability, $payload, $state);');
    $complete = strpos($source, '$state = $this->stateManager->setCompleted($state);');
    $assert($execute !== false && $complete !== false && $execute < $complete, 'Legacy interaction must accept/queue the command before persisting completed state.');
});


$test('external provider rejects invalid gateway outcomes instead of fabricating success', function () use ($assert): void {
    $gateway=new class implements App\Extensions\InteractionEngine\System\Capabilities\Contracts\CrmCapabilityGatewayInterface{public function supportedCapabilities():array{return['crm.customer.create'];}public function available(string$c,App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext$x):bool{return true;}public function execute(string$c,array$p,App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext$x):array{return['status'=>'pretend_success'];}public function readiness(App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext$x):array{return['status'=>'ready'];}};
    $provider=new App\Extensions\InteractionEngine\System\Capabilities\Providers\CrmCapabilityProvider($gateway);$ctx=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext('42','u1','human',['owner'],[],'api','corr');$result=$provider->execute('crm.customer.create',[],$ctx);$assert($result->status==='failed','Invalid owning-extension status must fail closed.');
});

$test('trusted command idempotency key propagates through capability execution context', function () use ($assert): void {
    $payload=['_context'=>['company_id'=>'42','company_id'=>'42','actor_id'=>'u1','actor_type'=>'human','idempotency_key'=>'trusted-key','correlation_id'=>'corr']];$ctx=App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext::fromPayload($payload);$assert($ctx->idempotencyKey==='trusted-key','Trusted _context.idempotency_key must reach provider execution context.');
});

$test('health check reports onboarding execution readiness separately from catalogue health', function () use ($root, $assert): void {
    $source = file_get_contents($root . '/System/Monitoring/HealthCheck.php') ?: '';
    $assert(str_contains($source, "'onboarding_execution'"), 'Health check must expose onboarding execution readiness.');
    $assert(str_contains($source, 'interaction_wizard_outbox'), 'Health check must verify the durable wizard outbox table.');
});


$test('core persistence uses company_id as the sole physical ownership column', function () use ($root, $assert): void {
    $migration = $root . '/database/migrations/2026_08_01_000000_create_interaction_runs_table.php';
    $assert(is_file($migration), 'Fresh core schemas must create canonical company_id columns directly.');
    foreach ([
        'System/Models/InteractionRun.php',
        'System/Models/InteractionAnswer.php',
        'System/Models/InteractionEvent.php',
        'System/Models/LocalIntelligenceMemory.php',
        'System/Models/CognitiveEvent.php',
    ] as $file) {
        $source = file_get_contents($root . '/' . $file) ?: '';
        $assert(str_contains($source, "'company_id'"), basename($file) . ' must expose company_id ownership.');
    }
    foreach ([
        'System/Repositories/EloquentInteractionRunRepository.php',
        'System/Repositories/EloquentInteractionAnswerRepository.php',
        'System/LocalIntelligence/Storage/EloquentLocalIntelligenceMemoryStore.php',
        'System/Cognition/Events/EloquentCognitiveEventStore.php',
    ] as $file) {
        $source = file_get_contents($root . '/' . $file) ?: '';
        $assert(str_contains($source, "where('company_id'"), basename($file) . ' must query by company_id.');
    }
});

$passed = $failed = 0;
foreach ($tests as $name => $fn) {
    try { $fn(); echo "PASS {$name}\n"; $passed++; }
    catch (Throwable $e) { echo "FAIL {$name}: {$e->getMessage()}\n"; $failed++; }
}
echo "\n{$passed}/" . count($tests) . " Phase 5.1 hardening tests passed\n";
exit($failed === 0 ? 0 : 1);
