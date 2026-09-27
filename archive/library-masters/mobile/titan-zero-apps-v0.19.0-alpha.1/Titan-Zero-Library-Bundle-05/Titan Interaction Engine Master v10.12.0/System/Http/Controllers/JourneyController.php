<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use App\Extensions\InteractionEngine\System\Authority\ApprovalSigner;
use App\Extensions\InteractionEngine\System\Capabilities\CapabilityExecutionContext;
use App\Extensions\InteractionEngine\System\Journey\JourneyRegistry;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingActionExecutor;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingProgressService;
use App\Extensions\InteractionEngine\System\Onboarding\OnboardingReadinessService;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingApprovalStoreInterface;
use App\Extensions\InteractionEngine\System\Onboarding\Storage\OnboardingPlanStoreInterface;
use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;
use App\Extensions\InteractionEngine\System\Wizard\Context\WizardExecutionContextFactory;
use App\Extensions\InteractionEngine\System\Wizard\Renderer\HybridRenderer;
use App\Extensions\InteractionEngine\System\Wizard\Security\WizardAccessPolicy;
use App\Extensions\InteractionEngine\System\Wizard\Security\WizardSessionAccessPolicy;
use App\Extensions\InteractionEngine\System\Wizard\Storage\WizardSessionStoreInterface;
use App\Extensions\InteractionEngine\System\Wizard\UniversalWizardEngine;
use App\Extensions\InteractionEngine\System\Wizard\WizardRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class JourneyController
{
    public function __construct(
        private readonly JourneyRegistry $journeys,
        private readonly SurfaceWizardPolicy $surfaces,
        private readonly WizardRegistry $wizards,
        private readonly UniversalWizardEngine $engine,
        private readonly WizardSessionStoreInterface $sessions,
        private readonly HybridRenderer $renderer,
        private readonly WizardExecutionContextFactory $contexts,
        private readonly WizardAccessPolicy $wizardAccess,
        private readonly WizardSessionAccessPolicy $sessionAccess,
        private readonly OnboardingPlanStoreInterface $plans,
        private readonly OnboardingApprovalStoreInterface $approvalStore,
        private readonly ApprovalSigner $approvalSigner,
        private readonly OnboardingActionExecutor $executor,
        private readonly OnboardingReadinessService $readinessService,
        private readonly OnboardingProgressService $progressService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $surface=$this->surfaces->canonicalSurface((string)$request->query('surface','zero'));
        $actor=$this->actor($request,['source_surface'=>$surface]);$items=[];
        foreach($this->journeys->forSurface($surface) as $journey){
            $first=$this->wizards->get($journey->wizardIds[0]);
            if($this->surfaces->allows($surface,$first->id)&&$this->wizardAccess->mayAccess($first,$actor))$items[]=$journey->toArray();
        }
        return response()->json(['surface'=>$surface,'journeys'=>$items]);
    }

    public function start(Request $request,string $journey): JsonResponse
    {
        if(!$this->journeys->has($journey))return response()->json(['message'=>'Journey not found.'],404);
        $definition=$this->journeys->get($journey);$surface=$this->surfaces->canonicalSurface((string)$request->input('surface',$definition->surfaces[0]??'zero'));
        if(!in_array($surface,$definition->surfaces,true))return response()->json(['message'=>'Journey is unavailable on this surface.'],403);
        $wizard=$this->wizards->get($definition->wizardIds[0]);$context=$this->actor($request,['source_surface'=>$surface,'journey_id'=>$definition->id]);
        if(!$this->surfaces->allows($surface,$wizard->id)||!$this->wizardAccess->mayAccess($wizard,$context))return response()->json(['message'=>'Journey access denied.'],403);
        $session=$this->engine->start($wizard->id,$context);$this->sessions->put($session);
        return response()->json(['journey'=>$definition->toArray()]+$this->renderer->render($session),201);
    }

    public function show(Request $request,string $session): JsonResponse
    {
        $wizardSession=$this->authorizedSession($request,$session);if($wizardSession instanceof JsonResponse)return$wizardSession;
        return response()->json($this->renderer->render($wizardSession));
    }

    public function answer(Request $request,string $session): JsonResponse
    {
        $data=$request->validate(['data'=>['required','array']]);$wizardSession=$this->authorizedSession($request,$session);if($wizardSession instanceof JsonResponse)return$wizardSession;
        $result=$this->engine->submitStep($wizardSession,(array)$data['data']);$this->sessions->put($result->session);
        return response()->json($this->renderer->render($result->session)+['errors'=>$result->errors,'guidance'=>$result->guidance,'complete'=>$result->complete,'command'=>$result->command],$result->errors===[]?200:422);
    }

    public function next(Request $request,string $session): JsonResponse { return $this->show($request,$session); }

    public function preview(Request $request,string $session): JsonResponse
    {
        $wizardSession=$this->authorizedSession($request,$session);if($wizardSession instanceof JsonResponse)return$wizardSession;
        $companyId=(string)($wizardSession->context['company_id']??'');$plan=$this->plans->get($companyId,$session);
        return response()->json(['interaction'=>$this->renderer->render($wizardSession),'plan'=>$plan?->toArray(),'preview_state'=>$plan===null?'wizard_in_progress':'plan_ready']);
    }

    public function approve(Request $request,string $session): JsonResponse
    {
        $wizardSession=$this->authorizedSession($request,$session);if($wizardSession instanceof JsonResponse)return$wizardSession;
        $validated=$request->validate(['action_ids'=>['required','array'],'action_ids.*'=>['string']]);$actor=$this->actor($request,['source_surface'=>(string)($wizardSession->context['source_surface']??'api')]);
        $companyId=(string)($actor['company_id']??'');$roles=array_values(array_map('strval',(array)($actor['roles']??[])));
        if(array_intersect($roles,['owner','admin'])===[])return response()->json(['message'=>'Company setup approval requires owner/admin authority.'],403);
        $plan=$this->plans->get($companyId,$session);if($plan===null)return response()->json(['message'=>'Onboarding plan is not ready for approval.'],409);
        $byId=[];foreach($plan->actions as$action)$byId[$action->id]=$action;$approved=[];
        foreach(array_values((array)$validated['action_ids']) as$actionId){$action=$byId[(string)$actionId]??null;if($action===null||!$action->requiresApproval)continue;$grant=$this->approvalSigner->issue($action->capability,$companyId,(string)($actor['user_id']??$actor['actor_id']??''),$roles,600,$action->id);$this->approvalStore->put($companyId,$plan->id,$action->id,$grant,600);$approved[]=['action_id'=>$action->id,'capability'=>$action->capability,'expires_at'=>$grant['expires_at']];}
        return response()->json(['plan_id'=>$plan->id,'approved'=>$approved]);
    }

    public function execute(Request $request,string $session): JsonResponse
    {
        $wizardSession=$this->authorizedSession($request,$session);if($wizardSession instanceof JsonResponse)return$wizardSession;
        $actor=$this->actor($request,['source_surface'=>(string)($wizardSession->context['source_surface']??'api')]);$companyId=(string)($actor['company_id']??'');$plan=$this->plans->get($companyId,$session);
        if($plan===null)return response()->json(['message'=>'Onboarding plan is not ready for execution.'],409);
        return response()->json(['execution'=>$this->executor->execute($plan,[],$actor)->toArray()]);
    }

    public function readiness(Request $request,string $session): JsonResponse
    {
        $wizardSession=$this->authorizedSession($request,$session);if($wizardSession instanceof JsonResponse)return$wizardSession;
        $actor=$this->actor($request,['source_surface'=>(string)($wizardSession->context['source_surface']??'api')]);$companyId=(string)($actor['company_id']??'');$plan=$this->plans->get($companyId,$session);
        if($plan===null)return response()->json(['message'=>'Onboarding plan is not ready for readiness checks.'],409);
        $actor['actor_id']=(string)($actor['actor_id']??$actor['user_id']??'');$context=CapabilityExecutionContext::fromPayload(['_context'=>$actor]);$readiness=$this->readinessService->aggregate($plan,$context);
        return response()->json(['readiness'=>$readiness,'progress'=>$this->progressService->build($plan,$readiness)]);
    }

    private function authorizedSession(Request $request,string $session): mixed
    {
        $wizardSession=$this->sessions->get($session);if($wizardSession===null)return response()->json(['message'=>'Interaction session not found.'],404);
        $actor=$this->actor($request,[]);if(!$this->sessionAccess->mayAccess($wizardSession,$actor))return response()->json(['message'=>'Interaction access denied.'],403);
        return $wizardSession;
    }

    private function actor(Request $request,array $input): array { return $this->contexts->build($request->user(),array_replace($request->all(),$input),$request->headers->all(),$this->trustedAuth($request)); }
    private function trustedAuth(Request $request): array { if(!$request->hasSession())return[];$ts=$request->session()->get('auth.password_confirmed_at');return is_numeric($ts)&&(int)$ts>0?['authenticated_at'=>(int)$ts]:[]; }
}
