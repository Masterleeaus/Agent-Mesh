<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Http\Controllers;

use App\Extensions\TitanTrust\System\Assurance\EvidenceRefFactory;
use App\Extensions\TitanTrust\System\Support\CompanyContext;
use App\Extensions\TitanTrust\System\Services\EvidenceReadiness;
use App\Extensions\TitanTrust\System\Services\AttendanceDeriver;
use App\Extensions\TitanTrust\System\Services\TrustEvaluator;
use App\Extensions\TitanTrust\System\Audit\JobEventWriter;
use App\Extensions\TitanTrust\System\Models\WorkEvidenceFile;
use App\Extensions\TitanTrust\System\Models\WorkEvidenceItem;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class CaptureController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'job_id' => ['required','integer'],
            'incident_id' => ['nullable','integer'],
        ]);

        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);
        $jobId = (int) $request->get('job_id');
        $incidentId = $request->filled('incident_id') ? (int) $request->get('incident_id') : null;

        $readiness = EvidenceReadiness::forJob($companyId, $userId, $jobId);

        $attendance = AttendanceDeriver::refreshDerived($companyId, $userId, $jobId);

        $recent = WorkEvidenceItem::query()
            ->where('company_id', $companyId)
            ->where('job_id', $jobId)
            ->latest('id')
            ->limit(10)
            ->get();

        return view('titantrust::capture.index', compact('jobId','readiness','recent','attendance'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'job_id' => ['required','integer'],
            'incident_id' => ['nullable','integer'],
            'evidence_type' => ['required','string'],
            'file' => ['required'],
            'captured_lat' => ['nullable','numeric'],
            'captured_lng' => ['nullable','numeric'],
            'captured_accuracy_m' => ['nullable','numeric'],
            'captured_source' => ['nullable','string','max:30'],
        ]);

        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);
        $jobId = (int) $request->get('job_id');
        $incidentId = $request->filled('incident_id') ? (int) $request->get('incident_id') : null;
        $evidenceType = (string) $request->get('evidence_type');

        $lat = $request->filled('captured_lat') ? (float) $request->get('captured_lat') : null;
        $lng = $request->filled('captured_lng') ? (float) $request->get('captured_lng') : null;
        $acc = $request->filled('captured_accuracy_m') ? (float) $request->get('captured_accuracy_m') : null;
        $src = $request->filled('captured_source') ? (string) $request->get('captured_source') : 'unknown';

        [$trustLevel, $trustFlags] = TrustEvaluator::evaluate($lat, $lng, $acc, $src);


        $files = is_array($request->file('file')) ? $request->file('file') : [$request->file('file')];

        DB::beginTransaction();

        try {
            foreach ($files as $file) {
                $disk = 'public';
                $basePath = 'work/evidence/' . $companyId . '/' . $userId . '/job-' . $jobId;
                $ext = $file->getClientOriginalExtension();
                $name = (string) Str::uuid() . ($ext ? ('.'.$ext) : '');

                $path = Storage::disk($disk)->putFileAs($basePath, $file, $name);

                $evFile = WorkEvidenceFile::query()->create([
                    'company_id' => $companyId,
                    'user_id' => $userId,
                    'disk' => $disk,
                    'path' => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'mime' => $file->getMimeType(),
                    'size' => (int) $file->getSize(),
                    'sha256' => hash_file('sha256', $file->getRealPath()),
                ]);

                $item = WorkEvidenceItem::query()->create([
                    'company_id' => $companyId,
                    'user_id' => $userId,
                    'job_id' => $jobId,
                    'incident_id' => $incidentId,
                    'evidence_type' => $evidenceType,
                    'file_id' => (int) $evFile->id,
                    'captured_by_user_id' => $userId,
                    'captured_at' => now(),
                    'captured_lat' => $lat,
                    'captured_lng' => $lng,
                    'captured_accuracy_m' => $acc,
                    'captured_source' => $src,
                    'trust_level' => $trustLevel,
                    'trust_flags' => $trustFlags,
                ]);
                $item->setRelation('file', $evFile);
                $evidenceRef = EvidenceRefFactory::fromItem($item);

                $ctx = (array) ($request->attributes->get('titantrust_audit_context') ?: []);
                JobEventWriter::write($companyId, $userId, $jobId, 'evidence_added', 'Captured evidence', null, null, [
                    'evidence_type' => $evidenceType,
                    'incident_id' => $incidentId,
                    'file_id' => (int) $evFile->id,
                    'sha256' => $evFile->sha256,
                    'gps' => ['lat' => $lat, 'lng' => $lng, 'accuracy_m' => $acc, 'source' => $src],
                    'trust' => ['level' => $trustLevel, 'flags' => $trustFlags],
                    'context' => $ctx,
                ]);
            }

            DB::commit();

            return redirect()->route('dashboard.user.titan-trust.capture.index', ['job_id'=>$jobId])
                ->with('success','Captured.');
        } catch (Throwable $e) {
            DB::rollBack();
            report($e);
            return back()->withErrors(['capture'=>'Upload failed']);
        }
    }
}
