<?php

namespace App\Extensions\TitanTrust\Http\Controllers;

use App\Extensions\TitanTrust\System\Support\CompanyContext;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use App\Extensions\TitanTrust\System\Audit\JobEventWriter;
use App\Extensions\TitanTrust\System\Security\TrustAuthorization;

class ManagerReviewController extends Controller
{
    public function index(Request $request)
    {
        TrustAuthorization::assertActorPermission($request->user(), TrustAuthorization::REVIEW_VIEW);
        $companyId = CompanyContext::fromRequest($request);
        $userId = (int) $request->user()->id;

        // Jobs with compliance failures (states not passed) OR open incidents.
        $failedStates = DB::table('work_jobs_states')
            ->where('company_id', $companyId)
            ->where('state_type', 'compliance')
            ->whereIn('status', ['failed', 'pending', 'needs_review'])
            ->select('job_id', DB::raw('MAX(updated_at) as last_update'))
            ->groupBy('job_id')
            ->get();

        $openIncidents = DB::table('work_jobs_incidents')
            ->where('company_id', $companyId)
            ->whereIn('status', ['open','new','pending','in_review'])
            ->select('job_id', DB::raw('COUNT(*) as open_count'), DB::raw('MAX(updated_at) as last_update'))
            ->groupBy('job_id')
            ->get()
            ->keyBy('job_id');

        $jobs = [];
        foreach ($failedStates as $row) {
            $jobs[$row->job_id] = [
                'job_id' => $row->job_id,
                'compliance' => 'flagged',
                'open_incidents' => (int) (($openIncidents[$row->job_id]->open_count ?? 0)),
                'last_update' => $row->last_update,
            ];
        }
        foreach ($openIncidents as $jobId => $row) {
            if (!isset($jobs[$jobId])) {
                $jobs[$jobId] = [
                    'job_id' => (int) $jobId,
                    'compliance' => 'unknown',
                    'open_incidents' => (int) $row->open_count,
                    'last_update' => $row->last_update,
                ];
            }
        }

        // Sort by last_update desc
        usort($jobs, fn($a,$b) => strcmp((string)$b['last_update'], (string)$a['last_update']));

        return view('titantrust::review/index', [
            'jobs' => $jobs,
        ]);
    }

    public function override(Request $request, int $jobId)
    {
        $request->validate([
            'reason' => ['required','string','min:6','max:2000'],
        ]);

        TrustAuthorization::assertActorPermission($request->user(), TrustAuthorization::COMPLIANCE_OVERRIDE);
        $companyId = CompanyContext::fromRequest($request);
        $userId = (int) $request->user()->id;

        // Mark overall compliance as passed with override metadata.
        DB::table('work_jobs_states')
            ->where('company_id', $companyId)
            ->where('job_id', $jobId)
            ->where('state_type','compliance')
            ->where('state_key','overall')
            ->update([
                'status' => 'passed',
                'checked_at' => now(),
                'meta_json' => json_encode([
                    'override' => true,
                    'override_reason' => $request->input('reason'),
                    'override_by_user_id' => $userId,
                    'override_at' => now()->toDateTimeString(),
                ]),
                'updated_at' => now(),
            ]);

        // Audit event
        JobEventWriter::write($companyId, $userId, $jobId, 'compliance_passed', 'Manager override', $request->input('reason'), 'warning', [
            'override' => true,
        ]);

        return redirect()->back()->with('success', 'Compliance overridden and marked as passed.');
    }
}
