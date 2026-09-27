<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Models;

use Illuminate\Database\Eloquent\Model;
use App\Extensions\TitanTrust\System\Models\Concerns\TenantScoped;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkEvidenceSignoff extends Model
{
    use TenantScoped;

    protected $table = 'work_jobs_evidence_signoffs';

    protected $fillable = [
        'company_id',
        'user_id',
        'job_id',
        'token',
        'status',
        'requested_at',
        'completed_at',
        'public_expires_at',
        'client_name',
        'signed_at',
        'signature_file_id',
        'notes',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'completed_at' => 'datetime',
        'public_expires_at' => 'datetime',
        'signed_at' => 'datetime',
    ];

    public function signatureFile(): BelongsTo
    {
        return $this->belongsTo(WorkEvidenceFile::class, 'signature_file_id');
    }
}
