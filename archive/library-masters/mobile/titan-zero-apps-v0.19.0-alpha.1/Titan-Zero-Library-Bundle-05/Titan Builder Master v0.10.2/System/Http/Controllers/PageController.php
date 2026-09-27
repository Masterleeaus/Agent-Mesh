<?php

declare(strict_types=1);

namespace App\Extensions\TitanBuilder\System\Http\Controllers;

use App\Extensions\TitanBuilder\System\Contracts\PageRepository;
use App\Extensions\TitanBuilder\System\Http\Requests\PageSpecStoreRequest;
use App\Extensions\TitanBuilder\System\Http\Requests\PageStoreRequest;
use App\Extensions\TitanBuilder\System\Models\BuilderPage;
use App\Extensions\TitanBuilder\System\Models\BuilderProject;
use App\Extensions\TitanBuilder\System\Security\BuilderAuthorization;
use App\Extensions\TitanBuilder\System\Security\CompanyContext;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * ENHANCED: Added proper text validation, merge strategies, and error handling
 */
final class PageController
{
    public function __construct(
        private readonly CompanyContext $company,
        private readonly PageRepository $pages,
        private readonly BuilderAuthorization $authorization,
    ) {}

    public function store(PageStoreRequest $request, int $project): JsonResponse
    {
        $this->authorization->require('builder.edit');
        $companyId = $this->company->id();
        $owner = BuilderProject::query()->forCompany($companyId)->whereKey($project)->first();
        if (! $owner) throw new NotFoundHttpException('Project not found.');
        $data = $request->validated();
        $page = BuilderPage::query()->create([
            'company_id' => $companyId,
            'project_id' => $project,
            'name' => $data['name'],
            'slug' => $data['slug'],
            'sort_order' => $data['sort_order'] ?? 0,
            'meta' => $data['meta'] ?? [],
        ]);
        return response()->json(['page' => $page], 201);
    }

    /**
     * ENHANCED: Improved text/widget persistence with better validation
     */
    public function saveSpec(PageSpecStoreRequest $request, int $page): JsonResponse
    {
        $this->authorization->require('builder.edit');
        
        $companyId = $this->company->id();
        $spec = (array) $request->validated('spec');
        $actorId = $this->company->actorId();
        
        try {
            $savedSpec = $this->pages->saveDraftSpec(
                $companyId, 
                $page, 
                $spec,
                $actorId
            );
            
            return response()->json([
                'page_spec' => $savedSpec,
                'checksum' => $savedSpec->checksum,
                'saved_at' => $savedSpec->created_at,
            ], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => 'Validation failed',
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('PageController::saveSpec failed', [
                'page_id' => $page,
                'company_id' => $companyId,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'error' => 'Failed to save page spec',
                'message' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * ENHANCED: Get current page with latest spec (for editor load)
     */
    public function show(int $pageId): JsonResponse
    {
        $this->authorization->require('builder.view');
        
        $companyId = $this->company->id();
        $page = $this->pages->findPageForCompany($companyId, $pageId);
        
        if (! $page) {
            throw new NotFoundHttpException('Page not found.');
        }
        
        $latestSpec = $this->pages->latestSpecForCompany($companyId, $pageId);
        
        return response()->json([
            'page' => $page,
            'spec' => $latestSpec?->spec ?? [],
            'checksum' => $latestSpec?->checksum,
        ], 200);
    }

    /**
     * ENHANCED: Partial spec update (text or widget only)
     */
    public function updatePartial(PageSpecStoreRequest $request, int $page): JsonResponse
    {
        $this->authorization->require('builder.edit');
        
        $companyId = $this->company->id();
        $incomingSpec = (array) $request->validated('spec');
        $mergeStrategy = $request->input('merge_strategy', 'full');
        $actorId = $this->company->actorId();
        
        try {
            $savedSpec = $this->pages->saveDraftSpecWithMerge(
                $companyId,
                $page,
                $incomingSpec,
                $mergeStrategy,
                $actorId
            );
            
            return response()->json([
                'page_spec' => $savedSpec,
                'checksum' => $savedSpec->checksum,
                'message' => 'Spec updated successfully',
            ], 200);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => 'Update failed',
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
