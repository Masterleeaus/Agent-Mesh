<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Assurance;

use App\Extensions\TitanTrust\System\Models\WorkEvidenceItem;
use App\Extensions\TitanTrust\System\Models\WorkEvidenceSignoff;
use App\Extensions\TitanTrust\System\Models\WorkJobAttendance;
use App\Extensions\TitanTrust\System\Models\WorkJobIncident;
use Modules\TitanZeroAssurance\ValueObjects\EvidenceRef;

final class EvidenceRefFactory
{
    public static function fromItem(WorkEvidenceItem $item): EvidenceRef
    {
        $file = $item->relationLoaded('file') ? $item->file : $item->file()->first();
        return new EvidenceRef((int) $item->company_id, (string) ($item->evidence_type ?: 'general'), 'titantrust:evidence:' . $item->id,
            $file?->sha256, $file ? ('storage://' . $file->disk . '/' . $file->path) : null, [
                'job_id' => $item->job_id ? (int) $item->job_id : null,
                'job_item_id' => $item->job_item_id ? (int) $item->job_item_id : null,
                'incident_id' => $item->incident_id ? (int) $item->incident_id : null,
                'file_id' => $item->file_id ? (int) $item->file_id : null,
                'sha256' => $file?->sha256,
                'captured_by_user_id' => $item->captured_by_user_id ? (int) $item->captured_by_user_id : null,
                'trust_level' => $item->trust_level,
            ]);
    }

    public static function fromSignoff(WorkEvidenceSignoff $signoff): EvidenceRef
    {
        $file = $signoff->relationLoaded('signatureFile') ? $signoff->signatureFile : $signoff->signatureFile()->first();
        return new EvidenceRef((int) $signoff->company_id, 'signoff', 'titantrust:signoff:' . $signoff->id, $file?->sha256,
            $file ? ('storage://' . $file->disk . '/' . $file->path) : null, ['job_id'=>(int)$signoff->job_id,'file_id'=>$signoff->signature_file_id,'sha256'=>$file?->sha256,'status'=>$signoff->status]);
    }

    public static function fromIncident(WorkJobIncident $incident): EvidenceRef
    {
        return new EvidenceRef((int) $incident->company_id, 'incident', 'titantrust:incident:' . $incident->id, null, null,
            ['job_id'=>(int)$incident->job_id,'incident_id'=>(int)$incident->id,'severity'=>$incident->severity,'status'=>$incident->status]);
    }

    public static function fromAttendance(WorkJobAttendance $attendance): EvidenceRef
    {
        return new EvidenceRef((int) $attendance->company_id, 'presence', 'titantrust:attendance:' . $attendance->id, null, null,
            ['job_id'=>(int)$attendance->job_id,'staff_user_id'=>$attendance->staff_user_id,'clock_in_at'=>(string)$attendance->clock_in_at,'clock_out_at'=>(string)$attendance->clock_out_at]);
    }
}
