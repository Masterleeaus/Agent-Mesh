<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Http\Controllers;

use App\Extensions\TitanTrust\System\Assurance\EvidenceRefFactory;
use App\Extensions\TitanTrust\System\Support\CompanyContext;
use App\Extensions\TitanTrust\System\Models\WorkJobIncident;
use App\Extensions\TitanTrust\System\Models\WorkEvidenceItem;
use App\Extensions\TitanTrust\System\Audit\JobEventWriter;
use App\Extensions\TitanTrust\System\Security\TrustAuthorization;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class IncidentController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);

        $q = WorkJobIncident::query()
            ->where('company_id', $companyId)
            ->latest('id');

        if ($request->filled('job_id')) $q->where('job_id', (int) $request->get('job_id'));
        if ($request->filled('status')) $q->where('status', (string) $request->get('status'));
        if ($request->filled('severity')) $q->where('severity', (string) $request->get('severity'));

        $incidents = $q->paginate(20)->withQueryString();

        return view('titantrust::incidents.index', compact('incidents'));
    }

    public function create(Request $request)
    {
        $defaults = [
            'job_id' => $request->get('job_id'),
            'job_item_id' => $request->get('job_item_id'),
            'incident_type' => $request->get('incident_type'),
            'severity' => $request->get('severity', 'medium'),
        ];

        return view('titantrust::incidents.create', compact('defaults'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'job_id' => ['required','integer'],
            'job_item_id' => ['nullable','integer'],
            'incident_type' => ['nullable','string','max:80'],
            'severity' => ['nullable','string','max:30'],
            'title' => ['required','string','max:190'],
            'description' => ['nullable','string','max:5000'],
        ]);

        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);

        $incident = WorkJobIncident::query()->create([
            'company_id' => $companyId,
            'user_id' => $userId,
            'job_id' => (int) $data['job_id'],
            'job_item_id' => $data['job_item_id'] ?? null,
            'incident_type' => $data['incident_type'] ?? 'other',
            'severity' => $data['severity'] ?? 'medium',
            'status' => 'open',
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'reported_by_user_id' => $userId,
            'reported_at' => now(),
        ]);

        EvidenceRefFactory::fromIncident($incident);

        // Send staff straight
        $ctx = (array) ($request->attributes->get('titantrust_audit_context') ?: []);
        JobEventWriter::write($companyId, $userId, (int) $incident->job_id, 'issue_opened', 'Incident opened', $incident->description ?? null, $incident->severity ?? null, [
            'incident_id' => (int) $incident->id,
            'incident_type' => $incident->incident_type,
            'title' => $incident->title,
            'context' => $ctx,
        ]);

        // Open evidence capture for incident photos.
        return redirect()->route('dashboard.user.titan-trust.capture.index', [
            'job_id' => $incident->job_id,
            'incident_id' => $incident->id,
        ])->with('success','Incident created. Add photos now.');
    }

    public function show(Request $request, int $id)
    {
        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);

        $incident = WorkJobIncident::query()
            ->where('company_id', $companyId)
            ->where('id', $id)
            ->firstOrFail();

        $items = WorkEvidenceItem::query()
            ->where('company_id', $companyId)
            ->where('incident_id', $incident->id)
            ->latest('id')
            ->get();

        return view('titantrust::incidents.show', compact('incident','items'));
    }

    public function resolve(Request $request, int $id)
    {
        $data = $request->validate([
            'resolution_notes' => ['nullable','string','max:5000'],
        ]);

        TrustAuthorization::assertActorPermission($request->user(), TrustAuthorization::INCIDENT_RESOLVE);
        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);

        $incident = WorkJobIncident::query()
            ->where('company_id', $companyId)
            ->where('id', $id)
            ->firstOrFail();

        $incident->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by_user_id' => $userId,
            'resolution_notes' => $data['resolution_notes'] ?? null,
        ]);

        $ctx = (array) ($request->attributes->get('titantrust_audit_context') ?: []);
        JobEventWriter::write($companyId, $userId, (int) $incident->job_id, 'issue_resolved', 'Incident resolved', $incident->resolution_notes ?? null, $incident->severity ?? null, [
            'incident_id' => (int) $incident->id,
            'context' => $ctx,
        ]);

        EvidenceRefFactory::fromIncident($incident->fresh());
        return redirect()->route('dashboard.user.titan-trust.incidents.show', $incident->id)->with('success','Incident resolved.');
    }
}
