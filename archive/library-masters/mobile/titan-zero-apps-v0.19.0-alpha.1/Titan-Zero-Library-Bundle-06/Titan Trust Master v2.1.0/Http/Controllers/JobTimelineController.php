<?php

namespace App\Extensions\TitanTrust\Http\Controllers;

use App\Extensions\TitanTrust\System\Support\CompanyContext;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use App\Extensions\TitanTrust\System\Audit\JobTimeline;

class JobTimelineController extends Controller
{
    public function show(Request $request, int $jobId)
    {
        $companyId = CompanyContext::fromRequest($request);
        $userId = (int) $request->user()->id;

        // Tenant-scoped timeline
        $events = JobTimeline::list($companyId, $userId, $jobId, 200);

        return view('titantrust::jobs.timeline', compact('jobId', 'events'));
    }
}
