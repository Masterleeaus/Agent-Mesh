<?php

declare(strict_types=1);

namespace App\Extensions\InteractionEngine\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Extensions\InteractionEngine\System\Wizard\Renderer\HybridRenderer;
use App\Extensions\InteractionEngine\System\Wizard\Storage\WizardSessionStoreInterface;
use App\Extensions\InteractionEngine\System\Wizard\UniversalWizardEngine;
use App\Extensions\InteractionEngine\System\Wizard\Context\WizardExecutionContextFactory;
use App\Extensions\InteractionEngine\System\Wizard\Security\WizardSessionAccessPolicy;
use App\Extensions\InteractionEngine\System\Wizard\Security\WizardAccessPolicy;
use App\Extensions\InteractionEngine\System\Wizard\WizardRegistry;
use App\Extensions\InteractionEngine\System\Surfaces\SurfaceWizardPolicy;
use App\Extensions\InteractionEngine\System\Settings\SettingsResolver;

final class WizardController
{
    public function __construct(
        private readonly WizardRegistry $registry,
        private readonly UniversalWizardEngine $engine,
        private readonly WizardSessionStoreInterface $sessions,
        private readonly HybridRenderer $renderer,
        private readonly WizardExecutionContextFactory $contexts,
        private readonly WizardSessionAccessPolicy $access,
        private readonly WizardAccessPolicy $wizardAccess,
        private readonly SurfaceWizardPolicy $surfacePolicy,
        private readonly SettingsResolver $settings,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $surface = trim((string) $request->query('surface', ''));
        $surface = $surface !== '' ? $this->surfacePolicy->canonicalSurface($surface) : '';
        $actor = $this->contexts->build($request->user(), $surface !== '' ? ['source_surface' => $surface] : [], $request->headers->all(), $this->trustedAuth($request));
        $allowed = array_values(array_filter($this->registry->all(), fn($wizard): bool => $this->wizardAccess->mayAccess($wizard, $actor) && ($surface === '' || $this->surfacePolicy->allows($surface, $wizard->id))));
        $wizards = array_map(static fn($wizard): array => [
            'id' => $wizard->id,
            'version' => $wizard->version,
            'name' => $wizard->name,
            'capability' => $wizard->capability,
            'permissions' => $wizard->permissions,
            'metadata' => $wizard->metadata,
            'offline' => $wizard->offline,
            'step_count' => $wizard->stepCount(),
        ], $allowed);

        return response()->json(['wizards' => $wizards, 'presentation_preferences' => $this->presentationPreferences($actor)]);
    }

    public function start(Request $request, string $wizardId): JsonResponse
    {
        if (!$this->registry->has($wizardId)) {
            return response()->json(['message' => "Wizard '{$wizardId}' was not found."], 404);
        }

        $input = $request->all();
        $surface = trim((string) ($input['surface'] ?? ''));
        if ($surface !== '') { $surface = $this->surfacePolicy->canonicalSurface($surface); $input['source_surface'] = $surface; }
        $context = $this->contexts->build($request->user(), $input, $request->headers->all(), $this->trustedAuth($request));
        $wizard = $this->registry->get($wizardId);
        if (($surface !== '' && !$this->surfacePolicy->allows($surface, $wizard->id)) || !$this->wizardAccess->mayAccess($wizard, $context)) {
            return response()->json(['message' => 'Wizard access was denied.'], 403);
        }
        $session = $this->engine->start($wizardId, $context);
        $this->sessions->put($session);

        $payload = $this->renderer->render($session);
        $payload['presentation_preferences'] = $this->presentationPreferences($context);
        return response()->json($payload, 201);
    }

    public function show(Request $request, string $sessionId): JsonResponse
    {
        $session = $this->sessions->get($sessionId);
        if ($session === null) {
            return response()->json(['message' => 'Wizard session was not found or has expired.'], 404);
        }
        $actor = $this->contexts->build($request->user(), [], $request->headers->all(), $this->trustedAuth($request));
        if (!$this->access->mayAccess($session, $actor)) {
            return response()->json(['message' => 'Wizard session access was denied.'], 403);
        }
        $payload = $this->renderer->render($session);
        $payload['presentation_preferences'] = $this->presentationPreferences($actor);
        return response()->json($payload);
    }

    public function submitStep(Request $request, string $sessionId): JsonResponse
    {
        $validated = $request->validate(['data' => ['required', 'array']]);
        $session = $this->sessions->get($sessionId);
        if ($session === null) {
            return response()->json(['message' => 'Wizard session was not found or has expired.'], 404);
        }
        $actor = $this->contexts->build($request->user(), [], $request->headers->all(), $this->trustedAuth($request));
        if (!$this->access->mayAccess($session, $actor)) {
            return response()->json(['message' => 'Wizard session access was denied.'], 403);
        }

        $result = $this->engine->submitStep($session, (array) $validated['data']);
        $this->sessions->put($result->session);
        $payload = $this->renderer->render($result->session);
        $payload['errors'] = $result->errors;
        $payload['guidance'] = $result->guidance;
        $payload['complete'] = $result->complete;
        $payload['command'] = $result->command;
        $payload['presentation_preferences'] = $this->presentationPreferences($actor);

        return response()->json($payload, $result->errors === [] ? 200 : 422);
    }

    private function presentationPreferences(array $actor): array
    {
        $companyId = trim((string) ($actor['company_id'] ?? ''));
        $userId = trim((string) ($actor['user_id'] ?? ''));
        if ($companyId === '' || $userId === '') return [];
        return $this->settings->presentationSnapshot($companyId, $userId);
    }

    private function trustedAuth(Request $request): array
    {
        if (!$request->hasSession()) return [];
        $timestamp = $request->session()->get('auth.password_confirmed_at');
        return is_numeric($timestamp) && (int) $timestamp > 0 ? ['authenticated_at' => (int) $timestamp] : [];
    }
}
