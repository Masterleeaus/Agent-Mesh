<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Http\Controllers;

use App\Extensions\TitanTrust\System\Assurance\EvidenceRefFactory;
use App\Extensions\TitanTrust\System\Support\CompanyContext;
use App\Extensions\TitanTrust\System\Http\Requests\StoreEvidenceRequest;
use App\Extensions\TitanTrust\System\Models\WorkEvidenceFile;
use App\Extensions\TitanTrust\System\Models\WorkEvidenceItem;
use App\Extensions\TitanTrust\System\Services\EvidenceReadiness;
use App\Extensions\TitanTrust\System\Audit\JobEventWriter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class EvidenceController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);

        $context = (string) ($request->get('context') ?: 'job-evidence');
        if ($request->filled('job_id') || $request->filled('job_item_id')) {
            $context = 'job-evidence';
        }

        $q = WorkEvidenceItem::query()
            ->with('file')
            ->where('company_id', $companyId)
            ->latest('id');

        if ($request->filled('job_id')) {
            $q->where('job_id', (int) $request->get('job_id'));
        }

        if ($request->filled('job_item_id')) {
            $q->where('job_item_id', (int) $request->get('job_item_id'));
        }

        if ($request->filled('q')) {
            $q->where('search_text','like','%' . $request->get('q') . '%');
        }

        if ($request->filled('type')) {
            $q->where('evidence_type', (string) $request->get('type'));
        }

        $items = $q->paginate(24)->withQueryString();

        $readiness = null;
        if ($request->filled('job_id')) {
            $readiness = EvidenceReadiness::forJob(
                $companyId,
                $userId,
                (int) $request->get('job_id'),
                $request->filled('template_id') ? (int) $request->get('template_id') : null,
                $request->get('job_type'),
                $request->get('site_type')
            );
        }

        return view('titantrust::evidence.index', compact('items','readiness','context'));
    }

    public function create(Request $request)
    {
        // defaults come from query params
        $defaults = [
            'context' => $request->get('context'),
            'job_id' => $request->get('job_id'),
            'job_item_id' => $request->get('job_item_id'),
                'incident_id' => $request->filled('incident_id') ? (int) $request->get('incident_id') : null,
            'evidence_type' => $request->get('type', 'general'),
        ];

        return view('titantrust::evidence.create', compact('defaults'));
    }

    public function attach(Request $request)
    {
        // convenience URL: /attach?job_id=..&job_item_id=..&type=before
        return redirect()->route('dashboard.user.titan-trust.create', $request->only(['context','job_id','job_item_id','type']));
    }

    public function store(StoreEvidenceRequest $request): RedirectResponse
    {
        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);
        $files = is_array($request->file('file')) ? $request->file('file') : [$request->file('file')];
        $allowed = (array) config('titantrust.allowed_mimes', []);
        $disk = (string) config('titantrust.disk', 'public');
        $basePath = trim((string) config('titantrust.base_path', 'work/evidence'), '/');
        $jobId = $request->filled('job_id') ? (int) $request->get('job_id') : null;

        DB::beginTransaction();
        try {
            foreach ($files as $file) {
                $mime = $file->getMimeType() ?: 'application/octet-stream';
                if ($allowed !== [] && !in_array($mime, $allowed, true)) {
                    throw new \InvalidArgumentException('File type not allowed.');
                }
                $dir = $basePath . '/' . $companyId . '/' . $userId . ($jobId ? ('/job-' . $jobId) : '');
                $ext = $file->getClientOriginalExtension();
                $name = (string) Str::uuid() . ($ext ? ('.' . $ext) : '');
                $sha256 = hash_file('sha256', $file->getRealPath());
                $size = (int) $file->getSize();
                $path = Storage::disk($disk)->putFileAs($dir, $file, $name);

                $evFile = WorkEvidenceFile::query()->create([
                    'company_id' => $companyId, 'user_id' => $userId, 'disk' => $disk, 'path' => $path,
                    'original_name' => $file->getClientOriginalName(), 'mime' => $mime, 'size' => $size,
                    'sha256' => $sha256, 'meta_json' => null,
                ]);
                $item = WorkEvidenceItem::query()->create([
                    'company_id' => $companyId, 'user_id' => $userId, 'job_id' => $jobId,
                    'job_item_id' => $request->filled('job_item_id') ? (int) $request->get('job_item_id') : null,
                    'incident_id' => $request->filled('incident_id') ? (int) $request->get('incident_id') : null,
                    'evidence_type' => (string) ($request->get('type') ?: $request->get('evidence_type') ?: 'general'),
                    'caption' => $request->get('caption'), 'file_id' => (int) $evFile->id,
                    'captured_by_user_id' => $userId, 'captured_at' => now(),
                ]);
                $item->setRelation('file', $evFile);
                $evidenceRef = EvidenceRefFactory::fromItem($item);

                if ($jobId) {
                    $ctx = (array) ($request->attributes->get('titantrust_audit_context') ?: []);
                    JobEventWriter::write($companyId, $userId, $jobId, 'evidence_added', 'Evidence uploaded', null, null, [
                        'evidence_ref' => $evidenceRef->toArray(), 'file_mime' => $mime, 'file_size' => $size,
                        'sha256' => $sha256, 'path' => $path, 'context' => $ctx,
                    ]);
                }
            }
            DB::commit();
            return redirect()->route('dashboard.user.titan-trust.index')->with('success', 'Evidence uploaded.');
        } catch (Throwable $e) {
            DB::rollBack();
            report($e);
            return back()->withErrors(['file' => 'Upload failed.']);
        }
    }

    public function show(Request $request, int $id)
    {
        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);

        $item = WorkEvidenceItem::query()
            ->with('file')
            ->where('company_id', $companyId)
            ->where('id', $id)
            ->firstOrFail();

        return view('titantrust::evidence.show', compact('item'));
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);

        $item = WorkEvidenceItem::query()
            ->with('file')
            ->where('company_id', $companyId)
            ->where('id', $id)
            ->firstOrFail();

        DB::beginTransaction();

        try {
            if ($item->file) {
                Storage::disk($item->file->disk)->delete($item->file->path);
                $item->file->delete();
            }

            $item->delete();

            // Audit timeline event
            if (!empty($item->job_id)) {
                $ctx = (array) (request()->attributes->get('titantrust_audit_context') ?: []);
                JobEventWriter::write($companyId, $userId, (int) $item->job_id, 'evidence_deleted', 'Evidence deleted', null, null, [
                    'evidence_type' => $item->evidence_type ?? $item->type ?? null,
                    'file_id' => $item->file_id,
                    'context' => $ctx,
                ]);
            }

            DB::commit();

            return redirect()->route('dashboard.user.titan-trust.index')->with('success', 'Evidence deleted.');
        } catch (Throwable $e) {
            DB::rollBack();
            report($e);
            return back()->withErrors(['delete' => 'Delete failed.']);
        }
    }
}
