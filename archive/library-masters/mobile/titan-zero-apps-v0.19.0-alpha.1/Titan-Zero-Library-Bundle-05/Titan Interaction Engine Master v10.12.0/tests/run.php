<?php

declare(strict_types=1);

$root = dirname(__DIR__);

spl_autoload_register(static function (string $class) use ($root): void {
    $prefixes = [
        'App\\Extensions\\InteractionEngine\\System\\Engines\\' => $root . '/System/Engines/',
        'App\\Extensions\\InteractionEngine\\System\\' => $root . '/System/',
    ];
    foreach ($prefixes as $prefix => $base) {
        if (str_starts_with($class, $prefix)) {
            $relative = substr($class, strlen($prefix));
            $path = $base . str_replace('\\', '/', $relative) . '.php';
            if (is_file($path)) {
                require_once $path;
            }
            return;
        }
    }
});

$tests = [];
$test = static function (string $name, callable $fn) use (&$tests): void { $tests[$name] = $fn; };
$assert = static function (bool $condition, string $message = 'Assertion failed'): void {
    if (!$condition) { throw new RuntimeException($message); }
};

$test('all PHP files pass syntax lint', function () use ($root, $assert): void {
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            $cmd = 'php -l ' . escapeshellarg($file->getPathname()) . ' 2>&1';
            exec($cmd, $out, $code);
            $assert($code === 0, $file->getPathname() . ': ' . implode("\n", $out));
            $out = [];
        }
    }
});

$test('source tree has no patch artifact filenames', function () use ($root, $assert): void {
    $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
    foreach ($it as $file) {
        if ($file->isFile()) {
            $name = $file->getFilename();
            $assert(!preg_match('/\((updated|example|add new bindings|updated with resolver)\)/i', $name), 'Patch artifact remains: ' . $file->getPathname());
        }
    }
});


$test('registered operational commands and support services contain executable PHP classes', function () use ($root, $assert): void {
    $files = [
        'System/Commands/InstallCommand.php',
        'System/Commands/HealthCheckCommand.php',
        'System/Commands/SeedCommand.php',
        'System/Monitoring/HealthCheck.php',
        'System/Error/ErrorHandler.php',
    ];
    foreach ($files as $relative) {
        $contents = (string) file_get_contents($root . '/' . $relative);
        $assert(str_starts_with(ltrim($contents), '<?php'), "{$relative} is not executable PHP");
        $assert(preg_match('/\bclass\s+\w+/', $contents) === 1, "{$relative} does not define a class");
    }
    $migration = (string) file_get_contents($root . '/database/migrations/2026_08_03_000000_create_long_term_memory_table.php');
    $assert(str_contains($migration, 'Schema::create'), 'Long-term memory migration is still a placeholder');
    $assert(str_contains($migration, "'local_intelligence_memories'"), 'Long-term memory table name is missing');
});

$test('all 80 engine pairs exist and implement their contracts', function () use ($root, $assert): void {
    $contracts = glob($root . '/System/Engines/*/Contracts/*Interface.php') ?: [];
    $implementations = glob($root . '/System/Engines/*/Implementations/*.php') ?: [];
    $assert(count($contracts) === 80, 'Expected 80 contracts, got ' . count($contracts));
    $assert(count($implementations) === 80, 'Expected 80 implementations, got ' . count($implementations));

    foreach ($contracts as $contractFile) {
        preg_match('#/Engines/([^/]+)/Contracts/([^/]+)Interface\.php$#', $contractFile, $m);
        $domain = $m[1];
        $engine = $m[2];
        $contract = "App\\Extensions\\InteractionEngine\\System\\Engines\\{$domain}\\Contracts\\{$engine}Interface";
        $implementation = "App\\Extensions\\InteractionEngine\\System\\Engines\\{$domain}\\Implementations\\{$engine}";
        $assert(interface_exists($contract), "Missing interface {$contract}");
        $assert(class_exists($implementation), "Missing implementation {$implementation}");
        $assert(is_subclass_of($implementation, $contract), "{$implementation} does not implement {$contract}");
    }
});


$test('all JSON resources are valid and the five foundation wizards load', function () use ($root, $assert): void {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'json') {
            try {
                json_decode((string) file_get_contents($file->getPathname()), true, 512, JSON_THROW_ON_ERROR);
            } catch (JsonException $error) {
                throw new RuntimeException($file->getPathname() . ': ' . $error->getMessage());
            }
        }
    }

    $registry = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $count = $registry->discover($root . '/resources/wizards');
    $expected = ['new_customer_v1', 'create_quote_v1', 'create_job_v1', 'complete_job_v1', 'create_invoice_v1'];
    $assert($count >= count($expected), 'Expected at least five wizard definitions');
    foreach ($expected as $wizardId) {
        $assert($registry->has($wizardId), "Missing foundation wizard {$wizardId}");
        $assert($registry->get($wizardId)->stepCount() >= 3, "Wizard {$wizardId} is too shallow");
    }
});


$test('TypeScript compiler config uses maintained Node module resolution', function () use ($root, $assert): void {
    $config = json_decode((string) file_get_contents($root . '/tsconfig.json'), true, 512, JSON_THROW_ON_ERROR);
    $resolution = strtolower((string) ($config['compilerOptions']['moduleResolution'] ?? ''));
    $module = strtolower((string) ($config['compilerOptions']['module'] ?? ''));
    $assert($resolution === 'node16', 'TypeScript moduleResolution must be Node16, not the removed Node/Node10 alias.');
    $assert($module === 'node16', 'TypeScript module must match Node16 resolution.');
});

$test('WebCrypto inputs use concrete ArrayBuffer values for current TypeScript DOM types', function () use ($root, $assert): void {
    $source = (string) file_get_contents($root . '/resources/ts/offline/crypto.ts');
    $assert(str_contains($source, 'function toArrayBuffer(bytes: Uint8Array): ArrayBuffer'), 'WebCrypto byte conversion helper is missing.');
    $assert(str_contains($source, "iv: toArrayBuffer(iv)"), 'Encryption IV must use a concrete ArrayBuffer.');
    $assert(str_contains($source, "iv: toArrayBuffer(fromBase64(payload.iv))"), 'Decryption IV must use a concrete ArrayBuffer.');
    $assert(str_contains($source, "toArrayBuffer(fromBase64(payload.ciphertext))"), 'Ciphertext must use a concrete ArrayBuffer.');
    $assert(str_contains($source, "toArrayBuffer(encoder.encode(secret))"), 'Digest input must use a concrete ArrayBuffer.');
});

$test('interaction definitions satisfy the executable schema contract', function () use ($root, $assert): void {
    $validator = new App\Extensions\InteractionEngine\System\Compiler\SchemaValidator();
    foreach (glob($root . '/interactions/*.json') ?: [] as $file) {
        $definition = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
        $validator->validate($definition);
    }
    try {
        $validator->validate(['id' => 'invalid']);
        $assert(false, 'Invalid definition should be rejected');
    } catch (InvalidArgumentException) {
        $assert(true);
    }
});

$test('universal wizard validates and completes a queueable field action into the offline outbox', function () use ($assert): void {
    $registry = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $registry->register([
        'id' => 'test_quote', 'version' => '1.0.0', 'name' => 'Test Quote',
        'capability' => 'crm.work_order.update',
        'offline' => ['enabled' => true, 'mode' => 'offline_queueable'],
        'steps' => [
            ['id' => 'customer', 'fields' => [['id' => 'customer_id', 'required' => true]]],
            ['id' => 'pricing', 'fields' => [['id' => 'total', 'type' => 'number', 'required' => true, 'min' => 0]]],
        ],
    ]);
    $outbox = new App\Extensions\InteractionEngine\System\Wizard\Offline\LocalCommandOutbox('test-secret');
    $engine = new App\Extensions\InteractionEngine\System\Wizard\UniversalWizardEngine(
        $registry,
        new App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine(),
        new App\Extensions\InteractionEngine\System\Wizard\Guidance\LocalGuidanceProvider(),
        new App\Extensions\InteractionEngine\System\Wizard\Command\CommandMapper(),
        $outbox,
    );
    $session = $engine->start('test_quote', ['company_id' => 't1', 'company_id' => 't1', 'user_id' => 7, 'device_id' => 'd1']);
    $invalid = $engine->submitStep($session, []);
    $assert($invalid->errors !== [], 'Required field should fail');
    $session = $engine->submitStep($session, ['customer_id' => 42])->session;
    $complete = $engine->submitStep($session, ['total' => 550.0]);
    $assert($complete->complete, 'Wizard should complete');
    $assert(count($outbox->pending()) === 1, 'Command should be queued');
    $assert($outbox->verify($outbox->pending()[0]), 'Queued command signature should verify');
});


$test('online wizard completion dispatches its governed provider command instead of losing it in memory', function () use ($assert): void {
    $registry = new App\Extensions\InteractionEngine\System\Wizard\WizardRegistry();
    $registry->register([
        'id' => 'online_job', 'name' => 'Online Job', 'capability' => 'crm.work_order.create',
        'steps' => [['id' => 'job', 'fields' => [['id' => 'customer_id', 'required' => true]]]],
    ]);
    $bus = new class implements App\Extensions\InteractionEngine\System\Contracts\CommandBusInterface {
        public array $dispatched = [];
        public function registerHandler(string $capability, callable $handler): void {}
        public function hasHandler(string $capability): bool { return true; }
        public function dispatch(string $capability, array $payload): void { $this->dispatched[] = [$capability, $payload]; }
    };
    $outbox = new App\Extensions\InteractionEngine\System\Wizard\Offline\LocalCommandOutbox('test-secret');
    $engine = new App\Extensions\InteractionEngine\System\Wizard\UniversalWizardEngine(
        $registry,
        new App\Extensions\InteractionEngine\System\Wizard\Validation\WizardValidationEngine(),
        new App\Extensions\InteractionEngine\System\Wizard\Guidance\LocalGuidanceProvider(),
        new App\Extensions\InteractionEngine\System\Wizard\Command\CommandMapper(),
        $outbox,
        $bus,
    );
    $result = $engine->submitStep($engine->start('online_job', ['company_id' => 't1', 'company_id' => 't1']), ['customer_id' => 'c1']);
    $assert($result->complete, 'Wizard did not complete');
    $assert(count($bus->dispatched) === 1, 'Online command was not dispatched');
    $assert(($bus->dispatched[0][0] ?? null) === 'crm.work_order.create', 'Wrong capability dispatched');
    $assert($outbox->pending() === [], 'Online command should not remain in the local outbox');
});

$test('decision tree chooses the strongest matching branch', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\LocalIntelligence\Decision\DecisionTreeEngine();
    $result = $engine->evaluate([
        'branches' => [
            ['id' => 'new', 'base_weight' => 0.5, 'conditions' => ['customer_exists' => false], 'conclusion' => 'create_customer'],
            ['id' => 'repeat', 'base_weight' => 0.8, 'conditions' => ['customer_exists' => true], 'conclusion' => 'prefill_quote'],
        ],
    ], ['customer_exists' => true]);
    $assert($result['conclusion'] === 'prefill_quote', 'Wrong branch selected');
    $assert($result['confidence'] >= 0.8, 'Confidence too low');
});

$test('local language engine extracts business intent and entities', function () use ($assert): void {
    $engine = new App\Extensions\InteractionEngine\System\LocalIntelligence\Language\LocalLanguageEngine();
    $result = $engine->understand('Book Jenny for her regular clean next Thursday morning.');
    $assert($result['intent'] === 'schedule_job', 'Expected schedule_job intent');
    $assert(($result['entities']['customer'] ?? null) === 'Jenny', 'Expected customer Jenny');
    $assert(isset($result['entities']['relative_date']), 'Expected relative date');
});

$test('behavioral memory predicts a repeated next action', function () use ($assert): void {
    $memory = new App\Extensions\InteractionEngine\System\LocalIntelligence\Memory\BehavioralMemory();
    foreach ([['complete_job','create_invoice'], ['complete_job','create_invoice'], ['complete_job','record_materials']] as $sequence) {
        foreach ($sequence as $action) { $memory->recordAction(1, $action, []); }
        $memory->resetSequence(1);
    }
    $prediction = $memory->predictNextAction(1, 'complete_job');
    $assert($prediction['action'] === 'create_invoice', 'Expected create_invoice prediction');
    $assert($prediction['confidence'] > 0.6, 'Expected majority confidence');
});

$test('local brain returns a structured offline recommendation', function () use ($assert): void {
    $brain = App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain::createDefault();
    $result = $brain->process('Create a quote for Jenny for carpet cleaning', ['user_id' => 1]);
    $assert(isset($result['perception'], $result['decision'], $result['suggestions']), 'Local brain response incomplete');
    $assert(($result['perception']['intent'] ?? '') === 'create_quote', 'Expected quote intent');
    $assert(($result['mode'] ?? '') === 'offline', 'Expected offline mode');
});




$test('wizard sessions survive storage round trips and render for API clients', function () use ($assert): void {
    $definition = App\Extensions\InteractionEngine\System\Wizard\WizardDefinition::fromArray([
        'id' => 'round_trip',
        'name' => 'Round Trip',
        'capability' => 'test.run',
        'steps' => [
            ['id' => 'first', 'title' => 'First', 'fields' => [['id' => 'value', 'required' => true]]],
            ['id' => 'second', 'title' => 'Second', 'fields' => [['id' => 'confirm', 'required' => true]]],
        ],
    ]);
    $session = new App\Extensions\InteractionEngine\System\Wizard\WizardSession(
        id: 'session-1',
        definition: $definition,
        stepIndex: 1,
        data: ['value' => 'saved'],
        context: ['company_id' => 't1', 'company_id' => 't1'],
        history: [['step_id' => 'first']],
    );
    $store = new App\Extensions\InteractionEngine\System\Wizard\Storage\InMemoryWizardSessionStore();
    $store->put($session);
    $loaded = $store->get('session-1');
    $assert($loaded instanceof App\Extensions\InteractionEngine\System\Wizard\WizardSession, 'Session was not restored');
    $assert($loaded->definition->id === 'round_trip', 'Definition was not restored');
    $assert($loaded->stepIndex === 1, 'Step index was not restored');
    $assert(($loaded->data['value'] ?? null) === 'saved', 'Session data was not restored');

    $rendered = (new App\Extensions\InteractionEngine\System\Wizard\Renderer\HybridRenderer())->render($loaded);
    $assert(($rendered['view_model']['session_id'] ?? null) === 'session-1', 'API view model missing session ID');
    $assert(($rendered['view_model']['step']['id'] ?? null) === 'second', 'API view model missing current step');
});

$test('foundation wizard capabilities use canonical provider ownership and controlled aliases', function () use ($assert): void {
    $providers = new App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry();
    $providers->register(new App\Extensions\InteractionEngine\System\Capabilities\Providers\CrmCapabilityProvider());
    $router = new App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter(
        $providers,
        new App\Extensions\InteractionEngine\System\Capabilities\CapabilityAliasRegistry(),
    );
    $registry = new App\Extensions\InteractionEngine\System\Registry\CapabilityRegistry($router);
    foreach (['crm.customer.create','crm.quote.create','crm.work_order.create','crm.work_order.complete','crm.invoice.create'] as $capability) {
        $assert($registry->declared($capability), "Capability {$capability} is not declared");
        $assert(!$registry->available($capability), "Unbound CRM capability {$capability} must fail closed");
    }
    $assert($router->canonical('jobs.create') === 'crm.work_order.create', 'Legacy jobs.create alias did not normalize');
    $assert($router->canonical('quotes.create') === 'crm.quote.create', 'Legacy quotes.create alias did not normalize');
});

$test('capability router propagates trusted company context without exposing provider persistence', function () use ($assert): void {
    $calls = [];
    $provider = new class($calls) implements App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderInterface {
        public array $calls=[];
        public function __construct(&$calls){$this->calls=&$calls;}
        public function providerKey(): string { return 'crm'; }
        public function descriptors(): array { return ['crm.work_order.create'=>new App\Extensions\InteractionEngine\System\Capabilities\CapabilityDescriptor('crm.work_order.create','crm','write','medium','approval_required',true,'online_required',true,[],[],false,[],[],true,null)]; }
        public function supports(string $capability): bool { return $capability==='crm.work_order.create'; }
        public function available(string $capability, App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext $context): bool { return $this->supports($capability) && $context->companyId==='company-1'; }
        public function execute(string $capability,array $payload,App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext $context): App\Extensions\InteractionEngine\System\Capabilities\CapabilityResult { $this->calls[]=['company_id'=>$context->companyId,'payload'=>$payload]; return App\Extensions\InteractionEngine\System\Capabilities\CapabilityResult::executed($capability,'crm',['id'=>'wo-1']); }
    };
    $providers=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityProviderRegistry();$providers->register($provider);
    $router=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityRouter($providers,new App\Extensions\InteractionEngine\System\Capabilities\CapabilityAliasRegistry());
    $context=new App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext('company-1','actor-1','human',['owner'],[],'command','corr-1');
    $result=$router->execute('crm.work_order.create',['customer_id'=>'c1'],$context);
    $assert($result->status==='executed','CRM provider did not execute');
    $assert(($calls[0]['company_id']??null)==='company-1','company_id did not propagate');
});

$test('critical engine implementations perform deterministic work', function () use ($assert): void {
    $reasoning = new App\Extensions\InteractionEngine\System\Engines\Cognitive\Implementations\ReasoningEngine();
    $deduction = $reasoning->deduce([
        ['if' => ['customer_exists' => true], 'then' => ['can_quote' => true]],
        ['facts' => ['customer_exists' => true]],
    ]);
    $assert(($deduction['facts']['can_quote'] ?? false) === true, 'Reasoning deduction failed');

    $embedding = new App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\EmbeddingEngine();
    $assert($embedding->embed('quote') !== $embedding->embed('invoice'), 'Embeddings should vary by text');

    $vectors = new App\Extensions\InteractionEngine\System\Engines\AIInfrastructure\Implementations\VectorSearchEngine();
    $vectors->index('quote', [1.0, 0.0]);
    $vectors->index('invoice', [0.0, 1.0]);
    $assert(($vectors->search([0.9, 0.1], 1)[0]['id'] ?? null) === 'quote', 'Vector search failed');

    $similarity = new App\Extensions\InteractionEngine\System\Engines\Learning\Implementations\SimilarityEngine();
    $most = $similarity->getMostSimilar('quote', ['quote request', 'weather report']);
    $assert(($most[0]['item'] ?? null) === 'quote request', 'String similarity ranking failed');

    $extractor = new App\Extensions\InteractionEngine\System\Engines\Memory\Implementations\KnowledgeExtractionEngine();
    $facts = $extractor->extractFacts('A quote requires a customer. A job has a schedule.');
    $assert(count($facts) >= 2, 'Knowledge extraction failed');
});


$test('cognitive event envelope validates and round trips', function () use ($assert): void {
    $event = App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent::create(
        type: App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventType::RecommendationCreated,
        companyId: 'tenant-a',
        userId: 'user-1',
        deviceId: 'device-1',
        subjectType: 'job',
        subjectId: 'job-1',
        payload: ['proposed_action' => 'assign_worker'],
        confidence: 0.82,
        evidence: [['type' => 'availability', 'value' => true]],
        correlationId: 'corr-1',
    );
    $copy = App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent::fromArray($event->toArray());
    $assert($copy->eventId === $event->eventId, 'Event UUID did not round trip');
    $assert($copy->companyId === 'tenant-a', 'Tenant scope was lost');
    $assert($copy->confidence === 0.82, 'Confidence was lost');
});

$test('cognitive event store is idempotent and tenant isolated', function () use ($assert): void {
    $store = new App\Extensions\InteractionEngine\System\Cognition\Events\InMemoryCognitiveEventStore();
    $event = App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent::create(
        type: App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventType::ObservationRecorded,
        companyId: 'tenant-a',
        payload: ['fact' => 'worker_available'],
        correlationId: 'corr-2',
        eventId: 'event-fixed',
    );
    $store->append($event);
    $store->append(App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent::create(
        type: App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventType::ObservationRecorded,
        companyId: 'tenant-b',
        payload: ['fact' => 'other'],
        correlationId: 'corr-2',
    ));
    $assert(count($store->forCorrelation('tenant-a', 'corr-2')) === 1, 'Duplicate or cross-tenant event leaked');
    $assert(count($store->forCorrelation('tenant-b', 'corr-2')) === 1, 'Tenant B event missing');
});

$test('prediction links to an outcome and produces a score event', function () use ($assert): void {
    $store = new App\Extensions\InteractionEngine\System\Cognition\Events\InMemoryCognitiveEventStore();
    $decisions = new App\Extensions\InteractionEngine\System\Cognition\Decision\DecisionRecorder($store);
    $outcomes = new App\Extensions\InteractionEngine\System\Cognition\Outcome\OutcomeRecorder($store);
    $prediction = $decisions->recordPrediction(
        companyId: 'tenant-a',
        proposedAction: 'create_invoice',
        confidence: 0.75,
        correlationId: 'corr-3',
        subjectType: 'job',
        subjectId: 'job-3',
    );
    $outcome = $outcomes->recordOutcome(
        companyId: 'tenant-a',
        outcome: ['action' => 'create_invoice', 'success' => true],
        correlationId: 'corr-3',
        subjectType: 'job',
        subjectId: 'job-3',
    );
    $score = (new App\Extensions\InteractionEngine\System\Cognition\Outcome\OutcomeLinker($store))->linkAndScore('tenant-a', $prediction->eventId, $outcome->eventId);
    $assert(($score->payload['matched'] ?? false) === true, 'Prediction should match outcome');
    $assert(($score->payload['brier_score'] ?? 1.0) < 0.1, 'Expected a low Brier score');
});

$test('local brain recommendation is not counted as confirmed user behaviour', function () use ($assert): void {
    $brain = App\Extensions\InteractionEngine\System\LocalIntelligence\LocalBrain::createDefault();
    $brain->process('Create a quote for Jenny', ['company_id' => 'tenant-a', 'user_id' => 'user-7']);
    $prediction = $brain->memory()->predictNextAction('user-7', 'create_quote');
    $assert($prediction['action'] === null, 'Recommendation polluted confirmed behavioural memory');
    $brain->confirmAction('user-7', 'create_quote', ['company_id' => 'tenant-a']);
    $brain->confirmAction('user-7', 'create_invoice', ['company_id' => 'tenant-a']);
    $next = $brain->memory()->predictNextAction('user-7', 'create_quote');
    $assert($next['action'] === 'create_invoice', 'Confirmed action sequence was not learned');
});

$test('offline cognitive events replay in original sequence order', function () use ($assert): void {
    $store = new App\Extensions\InteractionEngine\System\Cognition\Events\InMemoryCognitiveEventStore();
    foreach ([3, 1, 2] as $sequence) {
        $store->append(App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEvent::create(
            type: App\Extensions\InteractionEngine\System\Cognition\Events\CognitiveEventType::ObservationRecorded,
            companyId: 'tenant-a',
            payload: ['sequence' => $sequence],
            correlationId: 'offline-corr',
            sequence: $sequence,
        ));
    }
    $events = $store->forCorrelation('tenant-a', 'offline-corr');
    $assert(array_map(fn($e) => $e->sequence, $events) === [1, 2, 3], 'Offline replay order is incorrect');
});


$test('authority policy defaults to deny and protects human-only commands', function () use ($assert): void {
    $policy = new App\Extensions\InteractionEngine\System\Policy\PolicyEngine();
    $assert(!$policy->evaluate('unknown.capability', ['_context' => ['actor_type' => 'human']]), 'Unknown capability must fail closed');

    $policy->registerCapabilityPolicy(new App\Extensions\InteractionEngine\System\Authority\CapabilityPolicy(
        capability: 'finance.payment.approve',
        authority: App\Extensions\InteractionEngine\System\Authority\AuthorityLevel::UserOnly,
        requiredRoles: ['owner'],
        freshAuthenticationSeconds: 300,
    ));

    $denied = $policy->decide('finance.payment.approve', ['_context' => [
        'actor_type' => 'agent', 'roles' => ['owner'], 'authenticated_at' => time(),
    ]]);
    $assert(!$denied->allowed, 'An agent must never perform a user-only action');

    $allowed = $policy->decide('finance.payment.approve', ['_context' => [
        'actor_type' => 'human', 'user_id' => 'u1', 'roles' => ['owner'], 'authenticated_at' => time(),
    ]]);
    $assert($allowed->allowed, 'A freshly authenticated owner should be allowed');
});

$test('approval-required actions need scoped unexpired human approval', function () use ($assert): void {
    $signer = new App\Extensions\InteractionEngine\System\Authority\ApprovalSigner('test-approval-secret-12345');
    $policy = new App\Extensions\InteractionEngine\System\Policy\PolicyEngine($signer);
    $policy->registerCapabilityPolicy(new App\Extensions\InteractionEngine\System\Authority\CapabilityPolicy(
        capability: 'quotes.create',
        authority: App\Extensions\InteractionEngine\System\Authority\AuthorityLevel::ApprovalRequired,
        requiredRoles: ['manager'],
        approvalTtlSeconds: 600,
    ));
    $payload = ['total' => 2500, '_context' => ['actor_type' => 'agent', 'roles' => ['assistant']]];
    $assert(!$policy->decide('quotes.create', $payload)->allowed, 'Missing approval must be denied');
    $payload['_approval'] = $signer->issue('quotes.create', 't1', 'manager-1', ['manager'], 300);
    $payload['_context']['company_id'] = 't1';
    $assert($policy->decide('quotes.create', $payload)->allowed, 'Valid scoped approval should allow execution');
});

$test('delegated actions enforce scopes and numeric limits', function () use ($assert): void {
    $policy = new App\Extensions\InteractionEngine\System\Policy\PolicyEngine();
    $policy->registerCapabilityPolicy(new App\Extensions\InteractionEngine\System\Authority\CapabilityPolicy(
        capability: 'finance.refund.create',
        authority: App\Extensions\InteractionEngine\System\Authority\AuthorityLevel::DelegatedAutonomous,
        delegatedScopes: ['refunds:create'],
        numericLimits: ['amount' => 100.0],
    ));
    $context = ['actor_type' => 'agent', 'delegated_scopes' => ['refunds:create']];
    $assert($policy->decide('finance.refund.create', ['amount' => 80, '_context' => $context])->allowed, 'In-scope low-value action should be allowed');
    $assert(!$policy->decide('finance.refund.create', ['amount' => 150, '_context' => $context])->allowed, 'Limit breach must be denied');
});

$passed = 0;
foreach ($tests as $name => $fn) {
    try {
        $fn();
        echo "PASS {$name}\n";
        $passed++;
    } catch (Throwable $e) {
        echo "FAIL {$name}: {$e->getMessage()}\n";
    }
}

echo "\n{$passed}/" . count($tests) . " tests passed\n";
exit($passed === count($tests) ? 0 : 1);
