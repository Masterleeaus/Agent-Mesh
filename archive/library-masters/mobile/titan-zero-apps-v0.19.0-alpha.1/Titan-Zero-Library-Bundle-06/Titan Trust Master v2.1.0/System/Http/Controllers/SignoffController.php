<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Http\Controllers;

use App\Extensions\TitanTrust\System\Assurance\EvidenceRefFactory;
use App\Extensions\TitanTrust\System\Models\WorkEvidenceFile;
use App\Extensions\TitanTrust\System\Models\WorkEvidenceSignoff;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class SignoffController extends Controller
{
    /**
     * Staff creates a signoff request link for a job.
     * Auth required.
     */
    public function requestLink(Request $request)
    {
        $data = $request->validate([
            'job_id' => ['required','integer'],
            'expires_hours' => ['nullable','integer','min:1','max:720'],
        ]);

        $userId = (int) auth()->id();
        $companyId = CompanyContext::fromRequest($request);

        $jobId = (int) $data['job_id'];
        $expiresHours = (int) ($data['expires_hours'] ?? 168); // 7 days default
        $token = bin2hex(random_bytes(24));

        $signoff = WorkEvidenceSignoff::query()->create([
            'company_id' => $companyId,
            'user_id' => $userId,
            'job_id' => $jobId,
            'token' => $token,
            'status' => 'pending',
            'requested_at' => now(),
            'public_expires_at' => now()->addHours($expiresHours),
        ]);

        $publicUrl = route('titan-trust.public.signoff.show', ['token' => $token]);

        return view('titantrust::signoff.requested', compact('signoff','publicUrl'));
    }

    /**
     * Public signoff page (no auth), token-scoped.
     */
    public function publicShow(string $token)
    {
        $signoff = WorkEvidenceSignoff::query()->withoutGlobalScope('company_id')
            ->where('token', $token)
            ->firstOrFail();

        if ($signoff->public_expires_at && now()->greaterThan($signoff->public_expires_at)) {
            abort(410, 'This sign-off link has expired.');
        }

        if ($signoff->status === 'signed') {
            return view('titantrust::signoff.already', compact('signoff'));
        }

        return view('titantrust::signoff.public', compact('signoff'));
    }

    /**
     * Public submits signoff (no auth), token-scoped.
     */
    public function publicStore(Request $request, string $token)
    {
        $signoff = WorkEvidenceSignoff::query()->withoutGlobalScope('company_id')
            ->where('token', $token)
            ->firstOrFail();

        if ($signoff->public_expires_at && now()->greaterThan($signoff->public_expires_at)) {
            abort(410, 'This sign-off link has expired.');
        }

        if ($signoff->status === 'signed') {
            return redirect()->route('titan-trust.public.signoff.show', ['token' => $token]);
        }

        $data = $request->validate([
            'client_name' => ['required','string','max:190'],
            'signature' => ['required','file','max:5120'], // 5MB
            'notes' => ['nullable','string','max:2000'],
            'agree' => ['accepted'],
        ]);

        $disk = 'public';
        $basePath = 'work/evidence/' . $signoff->company_id . '/' . $signoff->user_id . '/job-' . ($signoff->job_id ?? 0) . '/signoff';
        $file = $request->file('signature');

        DB::beginTransaction();

        try {
            $ext = $file->getClientOriginalExtension();
            $name = (string) Str::uuid() . ($ext ? ('.'.$ext) : '');
            $path = Storage::disk($disk)->putFileAs($basePath, $file, $name);

            $evFile = WorkEvidenceFile::query()->create([
                'company_id' => $signoff->company_id,
                'user_id' => $signoff->user_id,
                'disk' => $disk,
                'path' => $path,
                'original_name' => $file->getClientOriginalName(),
                'mime' => $file->getMimeType(),
                'size' => (int) $file->getSize(),
                'sha256' => hash_file('sha256', $file->getRealPath()),
            ]);

            $signoff->update([
                'client_name' => $data['client_name'],
                'signature_file_id' => (int) $evFile->id,
                'notes' => $data['notes'] ?? null,
                'status' => 'signed',
                'signed_at' => now(),
                'completed_at' => now(),
            ]);

            $signoff->setRelation('signatureFile', $evFile);
            EvidenceRefFactory::fromSignoff($signoff);
            DB::commit();

            return redirect()->route('titan-trust.public.signoff.thanks', ['token' => $token]);
        } catch (Throwable $e) {
            DB::rollBack();
            report($e);
            return back()->withErrors(['signature' => 'Could not save signature. Please try again.']);
        }
    }

    public function publicThanks(string $token)
    {
        $signoff = WorkEvidenceSignoff::query()->withoutGlobalScope('company_id')
            ->where('token', $token)
            ->firstOrFail();

        return view('titantrust::signoff.thanks', compact('signoff'));
    }
}
