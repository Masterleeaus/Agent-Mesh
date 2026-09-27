<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use App\Extensions\InteractionEngine\System\Onboarding\OnboardingActionExecutor;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingPlanCompiler;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingReadinessService;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingProgressService;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingApprovalStoreInterface;
use App\Extensions\InteractionEngine\System\Authority\ApprovalSigner;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingPlanStoreInterface;
use App\Extensions\InteractionEngine\System\Profile\FieldHomeServicesProfile;
use App\Extensions\InteractionEngine\System\Company\CompanyExecutionContext;
use App\Extensions\InteractionEngine\System\Wizard\Context\WizardExecutionContextFactory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class FieldServicesOnboardingController
{
    public function __construct(
        private readonly CompanyExecutionContext $tenantContext,
        private readonly FieldHomeServicesProfile $profile,
        private readonly OnboardingPlanCompiler $compiler,
        private readonly OnboardingPlanStoreInterface $plans,
        private readonly OnboardingActionExecutor $executor,
        private readonly OnboardingReadinessService $readinessService,
        private readonly OnboardingProgressService $progressService,
        private readonly WizardExecutionContextFactory $contexts,
        private readonly OnboardingApprovalStoreInterface $approvalStore,
        private readonly ApprovalSigner $approvalSigner,
    ) {}

    public function catalogue(): JsonResponse
    {
        // The 121-row source catalogue is retained only for provenance. Public
        // onboarding discovery exposes the sanitized 116-field runtime wizard,
        // which contains canonical Titan/CRM/Builder/etc destination metadata.
        $path = dirname(__DIR__, 3) . '/resources/wizards/field_home_services_onboarding.json';
        $definition = is_file($path) ? json_decode((string) file_get_contents($path), true) : [];
        $questions = [];
        foreach ((array) data_get($definition, 'wizard.steps', []) as $step) {
            foreach ((array) ($step['fields'] ?? []) as $field) {
                $questions[] = [
                    'section' => (string) ($step['title'] ?? $step['id'] ?? ''),
                    'key' => (string) ($field['id'] ?? ''),
                    'question' => (string) ($field['label'] ?? $field['prompt'] ?? ''),
                    'response_type' => (string) ($field['type'] ?? 'text'),
                    'required' => (bool) ($field['required'] ?? false),
                    'handling' => $field['handling'] ?? null,
                    'branch_condition' => $field['branch_condition'] ?? null,
                    'destination_provider' => $field['destination_provider'] ?? null,
                    'capability' => $field['capability'] ?? null,
                    'destinations' => (array) ($field['destinations'] ?? []),
                    'risk' => $field['destination_risk'] ?? null,
                    'ui_hint' => $field['surface_rendering_hint'] ?? null,
                    'help_text' => $field['help_text'] ?? null,
                ];
            }
        }
        return response()->json([
            'profile' => FieldHomeServicesProfile::ID,
            'company_id' => $this->tenantContext->companyId(),
            'business_types' => $this->profile->businessTypes(),
            'questions' => $questions,
        ]);
    }

    public function compile(Request $request): JsonResponse
    {
        $validated = $request->validate(['answers' => ['required', 'array']]);
        $companyId = $this->tenantContext->companyId();
        $context = $this->contexts->build($request->user(), [], $request->headers->all(), $this->trustedAuth($request));
        $plan = $this->compiler->compile($companyId, (array) $validated['answers'], null, $context);
        $this->plans->put($plan);
        return response()->json(['plan' => $plan->toArray()], 201);
    }

    public function show(string $planId): JsonResponse
    {
        $plan = $this->plans->get($this->tenantContext->companyId(), $planId);
        if ($plan === null) {
            return response()->json(['message' => 'Onboarding plan was not found or belongs to another company.'], 404);
        }
        return response()->json(['plan' => $plan->toArray()]);
    }

    public function readiness(Request $request, string $planId): JsonResponse
    {
        $companyId = $this->tenantContext->companyId();
        $plan = $this->plans->get($companyId, $planId);
        if ($plan === null) return response()->json(['message' => 'Onboarding plan was not found or belongs to another company.'], 404);
        $actor = $this->contexts->build($request->user(), ['source_surface' => 'zero', 'journey' => 'onboarding'], $request->headers->all(), $this->trustedAuth($request));
        $actor['actor_id'] = (string) ($actor['user_id'] ?? '');
        $actor['source_surface'] = 'zero';
        $actor['journey'] = 'onboarding';
        $context = CapabilityExecutionContext::fromPayload(['_context' => $actor]);
        $readiness = $this->readinessService->aggregate($plan, $context);
        return response()->json(['readiness' => $readiness, 'progress' => $this->progressService->build($plan, $readiness)]);
    }

    public function approve(Request $request, string $planId): JsonResponse
    {
        $validated = $request->validate(['action_ids' => ['required','array'], 'action_ids.*' => ['string']]);
        $companyId = $this->tenantContext->companyId();
        $plan = $this->plans->get($companyId, $planId);
        if ($plan === null) return response()->json(['message' => 'Onboarding plan was not found or belongs to another company.'], 404);
        $actor = $this->contexts->build($request->user(), ['source_surface' => 'zero', 'journey' => 'onboarding'], $request->headers->all(), $this->trustedAuth($request));
        $roles = array_values(array_map('strval', (array)($actor['roles'] ?? [])));
        if (array_intersect($roles, ['owner','admin']) === []) return response()->json(['message' => 'Company setup approval requires owner/admin authority.'], 403);
        $byId=[]; foreach($plan->actions as $action) $byId[$action->id]=$action; $approved=[];
        foreach(array_values((array)$validated['action_ids']) as $actionId){
            $action=$byId[(string)$actionId]??null; if($action===null||!$action->requiresApproval) continue;
            $grant=$this->approvalSigner->issue($action->capability,$companyId,(string)($actor['user_id']??$actor['actor_id']??''),$roles,600,$action->id);
            $this->approvalStore->put($companyId,$plan->id,$action->id,$grant,600);
            $approved[]=['action_id'=>$action->id,'capability'=>$action->capability,'expires_at'=>$grant['expires_at']];
        }
        return response()->json(['plan_id'=>$plan->id,'approved'=>$approved]);
    }

    public function execute(Request $request): JsonResponse
    {
        $validated = $request->validate(['plan_id' => ['required', 'string']]);
        $companyId = $this->tenantContext->companyId();
        $plan = $this->plans->get($companyId, (string) $validated['plan_id']);
        if ($plan === null) {
            return response()->json(['message' => 'Onboarding plan was not found or belongs to another company.'], 404);
        }
        $actor = $this->contexts->build($request->user(), ['source_surface'=>'zero','journey'=>'onboarding'], $request->headers->all(), $this->trustedAuth($request));
        $result = $this->executor->execute($plan, [], $actor);
        return response()->json(['execution' => $result->toArray()]);
    }

    private function trustedAuth(Request $request): array
    {
        if (!$request->hasSession()) return [];
        $timestamp = $request->session()->get('auth.password_confirmed_at');
        return is_numeric($timestamp) && (int) $timestamp > 0 ? ['authenticated_at' => (int) $timestamp] : [];
    }
}
