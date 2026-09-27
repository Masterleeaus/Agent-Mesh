<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Contracts\ActionCatalog;
use App\Extensions\TitanBuilder\System\Contracts\AiUiGenerator;
use App\Extensions\TitanBuilder\System\Contracts\CapabilityDiscovery;
use App\Extensions\TitanBuilder\System\Data\CrmBuilderDataSourceProvider;
use App\Extensions\TitanBuilder\System\GenerativeUI\BuilderRegistry;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecNormaliser;
use App\Extensions\TitanBuilder\System\GenerativeUI\GenerativeUiSpecValidator;
use App\Extensions\TitanBuilder\System\Http\Requests\GenerativeUiRequest;
use App\Extensions\TitanBuilder\System\Models\AiGenerationJob;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use LogicException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class GenerativeUiController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly BuilderAuthorization $authorization,
        private readonly GenerativeUiSpecNormaliser $normaliser,
        private readonly GenerativeUiSpecValidator $validator,
        private readonly AiUiGenerator $generator,
        private readonly BuilderRegistry $registry,
        private readonly ActionCatalog $actions,
        private readonly CapabilityDiscovery $capabilities,
        private readonly CrmBuilderDataSourceProvider $crmDataSources,
    ) {}

    public function validateSpec(GenerativeUiRequest $request): JsonResponse
    {
        $this->authorization->require('builder.read');
        $this->company->id();
        return response()->json($this->validator->validate((array) $request->validated('spec')));
    }

    public function repair(GenerativeUiRequest $request): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $this->company->id();
        $repair = $this->normaliser->repair((array) $request->validated('spec'), (string) ($request->validated('surface') ?? 'preview'));
        $validation = $this->validator->validate($repair['spec']);
        return response()->json(['repair' => $repair, 'validation' => $validation], $validation['valid'] ? 200 : 422);
    }

    public function propose(Request $request): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $companyId = $this->company->id();
        $data = $request->validate([
            'prompt' => ['required','string','max:12000'],
            'project_id' => ['nullable','integer','min:1'],
            'surface' => ['nullable','string','in:customer,field,owner,onboarding,builder,page,canvas,mobile,preview'],
            'vertical_slug' => ['nullable','string','max:120'],
            'application_type' => ['nullable','string','max:120'],
            'brand_configuration' => ['nullable','array'],
            'device_target' => ['nullable','string','max:40'],
            'network_state' => ['nullable','string','max:40'],
            'current_application_spec' => ['nullable','array'],
            'user_request' => ['nullable','string','max:12000'],
        ]);

        $projectId = isset($data['project_id']) ? (int) $data['project_id'] : null;
        if ($projectId !== null && ! BuilderProject::query()->forCompany($companyId)->whereKey($projectId)->exists()) {
            throw new NotFoundHttpException('Builder project not found in the current company.');
        }
        $proposalSurface = (string) ($data['surface'] ?? 'builder');
        $availableCapabilities = $this->capabilities->available($companyId);
        $availableActions = [];
        foreach ($this->actions->all() as $action) {
            $compatible = array_values((array) ($action['surface_compatibility'] ?? []));
            $required = $action['required_capability'] ?? null;
            if (($compatible === [] || in_array($proposalSurface, $compatible, true))
                && (! is_string($required) || $required === '' || in_array($required, $availableCapabilities, true))) {
                $availableActions[] = (string) $action['id'];
            }
        }
        $availableSources = array_values(array_map(static fn (array $source): string => (string) $source['id'], array_filter(
            $this->crmDataSources->definitions($companyId),
            static fn (array $source): bool => ($source['available'] ?? false) === true
                && (((array) ($source['surface_compatibility'] ?? [])) === [] || in_array($proposalSurface, (array) $source['surface_compatibility'], true)),
        )));
        $context = [
            'company_id' => $companyId,
            'project_id' => $projectId,
            'surface' => $proposalSurface,
            'vertical_slug' => $data['vertical_slug'] ?? null,
            'application_type' => $data['application_type'] ?? null,
            'available_components' => $this->registry->componentIds(),
            'available_blocks' => array_values(array_filter(array_map(static fn (array $item): ?string => is_string($item['id'] ?? null) ? $item['id'] : null, $this->registry->all('blocks')))),
            'available_templates' => array_values(array_filter(array_map(static fn (array $item): ?string => is_string($item['id'] ?? null) ? $item['id'] : null, $this->registry->all('templates')))),
            'available_themes' => array_values(array_filter(array_map(static fn (array $item): ?string => is_string($item['id'] ?? null) ? $item['id'] : null, $this->registry->all('themes')))),
            'available_data_sources' => $availableSources,
            'available_action_intents' => $availableActions,
            'brand_configuration' => (array) ($data['brand_configuration'] ?? []),
            'device_target' => $data['device_target'] ?? null,
            'network_state' => $data['network_state'] ?? null,
            'current_application_spec' => (array) ($data['current_application_spec'] ?? []),
            'user_request' => (string) ($data['user_request'] ?? $data['prompt']),
        ];

        $job = AiGenerationJob::query()->create([
            'company_id' => $companyId,
            'project_id' => $projectId,
            'provider' => 'titan-ai',
            'status' => 'running',
            'prompt_hash' => hash('sha256', (string) $data['prompt']),
            'request' => ['surface' => $context['surface'], 'vertical_slug' => $context['vertical_slug'], 'device_target' => $context['device_target'], 'network_state' => $context['network_state']],
        ]);

        try {
            $proposal = $this->generator->propose((string) $data['prompt'], $context);
            $job->forceFill(['status' => 'completed', 'response' => ['checksum' => hash('sha256', json_encode($proposal, JSON_UNESCAPED_SLASHES) ?: '')]])->save();
            return response()->json(['proposal' => $proposal, 'validation' => $this->validator->validate($proposal), 'authority' => 'proposal-only']);
        } catch (LogicException $exception) {
            $job->forceFill(['status' => 'unavailable', 'error' => $exception->getMessage()])->save();
            return response()->json(['error' => 'TitanAI is unavailable.', 'authority' => 'fail-closed'], 503);
        } catch (\Throwable $exception) {
            $job->forceFill(['status' => 'failed', 'error' => mb_substr($exception->getMessage(), 0, 2000)])->save();
            throw $exception;
        }
    }
}
