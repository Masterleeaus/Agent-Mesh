<?php

namespace Modules\QualityControl\Http\Controllers;

use Illuminate\Routing\Controller;
use Modules\QualityControl\Http\Requests\StoreInspectionTemplateRequest;
use Modules\QualityControl\Http\Requests\UpdateInspectionTemplateRequest;
use Modules\QualityControl\Services\TemplateService;

class InspectionTemplateController extends Controller
{
    public function __construct(private readonly TemplateService $templates)
    {
    }

    public function index()
    {
        $templates = $this->templates->paginate(20);

        return view('quality_control::templates.index', compact('templates'));
    }

    public function create()
    {
        return view('quality_control::templates.create');
    }

    public function store(StoreInspectionTemplateRequest $request)
    {
        $template = $this->templates->create($request->validated());

        return redirect()
            ->route('inspection-templates.edit', $template->id)
            ->with('success', __('quality_control::messages.template_created'));
    }

    public function show($id)
    {
        $template = $this->templates->findWithItems((int) $id);

        return view('quality_control::templates.show', compact('template'));
    }

    public function edit($id)
    {
        $template = $this->templates->findWithItems((int) $id);

        return view('quality_control::templates.edit', compact('template'));
    }

    public function update(UpdateInspectionTemplateRequest $request, $id)
    {
        $this->templates->update((int) $id, $request->validated());

        return back()->with('success', __('quality_control::messages.template_updated'));
    }

    public function destroy($id)
    {
        $this->templates->delete((int) $id);

        return redirect()
            ->route('inspection-templates.index')
            ->with('success', __('quality_control::messages.template_deleted'));
    }
}
