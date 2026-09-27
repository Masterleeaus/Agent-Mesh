<?php

namespace Modules\QualityControl\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\AccountBaseController;
use Modules\QualityControl\Entities\InspectionTemplate;
use Modules\QualityControl\Support\ModuleAccess;
use Illuminate\Support\Facades\Event;
use Modules\QualityControl\Entities\QcRecord;
use Modules\QualityControl\Domain\Quality\Actions\CreateComplaintFromQcFailureAction;
use Modules\QualityControl\Domain\Quality\Actions\CreateQcRecordAction;
use Modules\QualityControl\Domain\Quality\Actions\MarkNeedsRecleanAction;
use Modules\QualityControl\Domain\Quality\Actions\PassQcRecordAction;
use Modules\QualityControl\Domain\Quality\DTOs\QcRecordData;
use Modules\QualityControl\Http\Requests\StoreQcRecordRequest;
use Modules\QualityControl\Http\Requests\UpdateQcRecordRequest;
use Modules\QualityControl\Services\ExecutionRecordService;

class QcRecordController extends AccountBaseController
{
    public function __construct(
        private readonly ExecutionRecordService $records,
        private readonly CreateQcRecordAction $createQcRecord,
        private readonly PassQcRecordAction $passQcRecord,
        private readonly MarkNeedsRecleanAction $markNeedsReclean,
        private readonly CreateComplaintFromQcFailureAction $createComplaintFromQcFailure,
    )
    {
        parent::__construct();
        $this->pageTitle = __('quality_control::sidebar.qc_records');
        $this->middleware(function ($request, $next) {
            abort_403(!ModuleAccess::userHasModule($this->user));

            return $next($request);
        });
    }


    public function index(Request $request)
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('view_quality_control'), ['all']));

        $companyId = $this->user->company_id ?? null;

        $records = $this->records->listForCompany($companyId, [
            'property_id' => $request->integer('property_id'),
            'unit_id' => $request->integer('unit_id'),
            'room_id' => $request->integer('room_id'),
            'visit_id' => $request->integer('visit_id'),
        ])
            ->latest()
            ->paginate(20);

        $this->data['records'] = $records;

        return view('quality_control::qc-records.index', $this->data);
    }

    public function create()
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('add_quality_control'), ['all']));

        $this->templates = InspectionTemplate::where('is_active', true)->orderBy('name')->get();
        $this->statuses  = QcRecord::STATUSES;

        return view('quality_control::qc-records.create', $this->data);
    }

    public function store(StoreQcRecordRequest $request)
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('add_quality_control'), ['all']));

        $record = $this->createQcRecord->handle(
            QcRecordData::fromArray($request->validated()),
            $this->user
        );

        $this->maybeAutoTriggerReclean($record);

        return redirect()
            ->route('qc-records.show', $record->id)
            ->with('success', __('quality_control::messages.qc_record_created'));
    }

    public function show($id)
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('view_quality_control'), ['all']));

        $record = $this->records->findForTenant((int) $id, $this->user->company_id ?? null);

        $this->record           = $record;
        $this->canTriggerReclean = in_array(ModuleAccess::permissionLevel('trigger_reclean'), ['all'])
            && !$record->reclean_triggered
            && $record->isBelowThreshold();

        return view('quality_control::qc-records.show', $this->data);
    }

    public function destroy($id)
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('delete_quality_control'), ['all']));

        $this->records->delete((int) $id, $this->user->company_id ?? null);

        return redirect()
            ->route('qc-records.index')
            ->with('success', __('quality_control::messages.qc_record_deleted'));
    }

    public function edit($id)
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('edit_quality_control'), ['all']));

        $this->record = $this->records->findForTenant((int) $id, $this->user->company_id ?? null);
        $this->templates = InspectionTemplate::where('is_active', true)->orderBy('name')->get();
        $this->statuses  = QcRecord::STATUSES;

        return view('quality_control::qc-records.create', $this->data);
    }

    public function update(UpdateQcRecordRequest $request, $id)
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('edit_quality_control'), ['all']));

        $record = $this->records->update((int) $id, $request->validated(), $this->user->company_id ?? null);
        $this->maybeAutoTriggerReclean($record);

        return redirect()
            ->route('qc-records.show', $record->id)
            ->with('success', __('messages.updateSuccess'));
    }

    /**
     * POST /account/qc-records/{id}/trigger-reclean
     */
    public function triggerReclean(Request $request, $id)
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('trigger_reclean'), ['all']));

        $record = $this->records->findForTenant((int) $id, $this->user->company_id ?? null);

        if ($record->reclean_triggered) {
            return back()->with('warning', __('quality_control::messages.reclean_already_triggered'));
        }

        $record = $this->markNeedsReclean->handle($record, (string) $request->input('reason', 'manual_trigger'));

        // Dispatch a loose-coupled event that other modules can listen to.
        Event::dispatch('quality_control.reclean_triggered', [$record]);

        if (config('quality_control.create_issue_on_needs_reclean', true)) {
            Event::dispatch('inspection.needs_reclean', [$record->booking_id, $record->cleaner_id, $record->id]);
        }

        return back()->with('success', __('quality_control::messages.reclean_triggered'));
    }

    public function approve(Request $request, $id)
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('edit_quality_control'), ['all']));
        $record = $this->records->findForTenant((int) $id, $this->user->company_id ?? null);
        $this->passQcRecord->handle($record);

        return back()->with('success', __('messages.updateSuccess'));
    }

    public function requestReclean(Request $request, $id)
    {
        abort_403(!in_array(ModuleAccess::permissionLevel('trigger_reclean'), ['all']));
        $record = $this->records->findForTenant((int) $id, $this->user->company_id ?? null);
        $record = $this->markNeedsReclean->handle($record, (string) $request->input('reason', 'manual_request'));
        Event::dispatch('quality_control.reclean_triggered', [$record]);

        return back()->with('success', __('quality_control::messages.reclean_triggered'));
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private function maybeAutoTriggerReclean(QcRecord $record): void
    {
        if (!$record->isBelowThreshold()) {
            return;
        }

        $record = $this->markNeedsReclean->handle($record, 'below_threshold');

        Event::dispatch('quality_control.reclean_triggered', [$record]);
        Event::dispatch('quality_control.record_failed', [$record]);

        if (config('quality_control.auto_create_complaint_on_failed_qc', true)) {
            $this->createComplaintFromQcFailure->handle($record);
        }

        if (config('quality_control.create_issue_on_needs_reclean', true)) {
            Event::dispatch('inspection.needs_reclean', [$record->booking_id, $record->cleaner_id, $record->id]);
        }
    }
}
