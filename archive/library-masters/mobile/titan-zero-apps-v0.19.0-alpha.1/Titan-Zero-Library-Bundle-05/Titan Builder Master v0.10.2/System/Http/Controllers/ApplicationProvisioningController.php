<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Contracts\ApplicationProvisioningGateway;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Authenticated company-scoped API used by Titan Onboarding and advanced Builder clients. */
final class ApplicationProvisioningController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly BuilderAuthorization $authorization,
        private readonly ApplicationProvisioningGateway $gateway,
    ) {}

    public function index(): JsonResponse
    {
        $this->authorization->require('builder.read');
        return response()->json(['applications' => $this->gateway->getApplications($this->company->id())]);
    }

    public function show(string $surface): JsonResponse
    {
        $this->authorization->require('builder.read');
        return response()->json(['application' => $this->gateway->getApplication($this->company->id(), $surface)]);
    }

    public function create(string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        return response()->json(['application' => $this->gateway->createApplication($this->company->id(), $surface, $this->company->actorId(), $this->authorization->auditContext())], 201);
    }

    public function provisionSet(Request $request): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate([
            'configuration' => ['sometimes','array'],
            'configuration.brand' => ['sometimes','array'],
            'configuration.vertical' => ['sometimes','string','max:120'],
            'configuration.identity' => ['sometimes','array'],
            'configuration.features' => ['sometimes','array'],
            'configuration.navigation' => ['sometimes','array'],
            'configuration.theme' => ['sometimes','array'],
            'configuration.assistant' => ['sometimes','array'],
            'configuration.privacy' => ['sometimes','array'],
            'configuration.notifications' => ['sometimes','array'],
            'configuration.offline' => ['sometimes','array'],
            'configuration.pages' => ['sometimes','array'],
        ]);
        return response()->json($this->gateway->provisionApplicationSet(
            $this->company->id(),
            (array) ($data['configuration'] ?? []),
            $this->company->actorId(),
            $this->authorization->auditContext(),
        ));
    }

    public function handoff(): JsonResponse
    {
        $this->authorization->require('builder.read');
        return response()->json($this->gateway->handoff($this->company->id()));
    }

    public function sharedBrand(Request $request): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['brand' => ['required','array']]);
        return response()->json(['applications' => $this->gateway->configureSharedBrand($this->company->id(), (array) $data['brand'], $this->company->actorId(), $this->authorization->auditContext())]);
    }

    public function identity(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['identity' => ['required','array']]);
        return $this->configured($this->gateway->configureIdentity($this->company->id(), $surface, (array) $data['identity'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function brand(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['brand' => ['required','array']]);
        return $this->configured($this->gateway->configureBrand($this->company->id(), $surface, (array) $data['brand'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function navigation(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['navigation' => ['required','array']]);
        return $this->configured($this->gateway->configureNavigation($this->company->id(), $surface, (array) $data['navigation'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function features(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['features' => ['required','array']]);
        return $this->configured($this->gateway->configureFeatures($this->company->id(), $surface, (array) $data['features'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function pages(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['pages' => ['required','array'], 'pages.*' => ['string','max:120']]);
        return $this->configured($this->gateway->configurePages($this->company->id(), $surface, (array) $data['pages'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function theme(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['theme' => ['required','string','max:120']]);
        return $this->configured($this->gateway->configureTheme($this->company->id(), $surface, (string) $data['theme'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function assistant(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['assistant' => ['required','array']]);
        return $this->configured($this->gateway->configureAssistantPresentation($this->company->id(), $surface, (array) $data['assistant'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function privacy(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['privacy' => ['required','array']]);
        return $this->configured($this->gateway->configurePrivacy($this->company->id(), $surface, (array) $data['privacy'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function notifications(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['notifications' => ['required','array']]);
        return $this->configured($this->gateway->configureNotifications($this->company->id(), $surface, (array) $data['notifications'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function offline(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['offline' => ['required','array']]);
        return $this->configured($this->gateway->configureOfflinePolicy($this->company->id(), $surface, (array) $data['offline'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function vertical(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $data = $request->validate(['vertical' => ['required','string','max:120']]);
        return $this->configured($this->gateway->applyVerticalPack($this->company->id(), $surface, (string) $data['vertical'], $this->company->actorId(), $this->authorization->auditContext()));
    }

    public function preview(Request $request, string $surface): JsonResponse
    {
        $this->authorization->require('builder.read');
        $data = $request->validate(['device' => ['nullable','string'], 'state' => ['nullable','string']]);
        return response()->json($this->gateway->preview($this->company->id(), $surface, array_filter($data, static fn ($v): bool => $v !== null)));
    }

    public function validateApplication(string $surface): JsonResponse
    {
        $this->authorization->require('builder.read');
        return response()->json($this->gateway->validate($this->company->id(), $surface));
    }

    public function readiness(string $surface): JsonResponse
    {
        $this->authorization->require('builder.read');
        return response()->json($this->gateway->getReadiness($this->company->id(), $surface));
    }

    public function publish(string $surface): JsonResponse
    {
        $this->authorization->require('builder.publish');
        return response()->json(['application' => $this->gateway->publish($this->company->id(), $surface, $this->company->actorId(), $this->authorization->auditContext())]);
    }

    public function rollback(string $surface, int $snapshot): JsonResponse
    {
        $this->authorization->require('builder.publish');
        return response()->json(['application' => $this->gateway->rollback($this->company->id(), $surface, $snapshot, $this->company->actorId(), $this->authorization->auditContext())]);
    }

    public function activate(string $surface, int $snapshot): JsonResponse
    {
        $this->authorization->require('builder.publish');
        return response()->json(['application' => $this->gateway->activate($this->company->id(), $surface, $snapshot, $this->company->actorId(), $this->authorization->auditContext())]);
    }

    private function configured(array $application): JsonResponse
    {
        return response()->json(['application' => $application]);
    }
}
