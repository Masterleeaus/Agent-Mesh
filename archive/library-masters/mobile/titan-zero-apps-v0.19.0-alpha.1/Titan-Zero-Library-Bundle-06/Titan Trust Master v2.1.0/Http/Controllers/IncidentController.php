<?php

namespace App\Extensions\TitanTrust\Http\Controllers;

use App\Extensions\TitanTrust\System\Support\CompanyContext;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use App\Extensions\TitanTrust\System\Audit\JobEventWriter;
use App\Extensions\TitanTrust\System\Security\TrustAuthorization;

class IncidentController extends Controller
{
    public function index(Request $request, int $jobId)
    {
        $companyId = CompanyContext::fromRequest($request);
        $userId = (int) $request->user()->id;

        $incidents = DB::table('work_jobs_incidents')
            ->where('company_id', $companyId)
            ->where('job_id', $jobId)
            ->orderByDesc('created_at')
            ->get();

        return view('titantrust::incidents/index', compact('jobId','incidents'));
    }

    public function resolve(Request $request, int $incidentId)
    {
        $request->validate([
            'resolution_note' => ['required','string','min:3','max:2000'],
        ]);

        TrustAuthorization::assertActorPermission($request->user(), TrustAuthorization::INCIDENT_RESOLVE);
        $companyId = CompanyContext::fromRequest($request);
        $userId = (int) $request->user()->id;

        $incident = DB::table('work_jobs_incidents')
            ->where('company_id', $companyId)
            ->where('id', $incidentId)
            ->first();

        if (!$incident) {
            abort(404);
        }

        DB::table('work_jobs_incidents')->where('id', $incidentId)->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'updated_at' => now(),
        ]);

        JobEventWriter::write($companyId, $userId, (int)$incident->job_id, 'issue_resolved', 'Incident resolved', $request->input('resolution_note'), 'info', [
            'incident_id' => (int)$incidentId,
        ]);

        return redirect()->back()->with('success', 'Incident resolved.');
    }
}
