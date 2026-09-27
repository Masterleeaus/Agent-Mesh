<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Models;

use Illuminate\Database\Eloquent\Model;
use App\Extensions\TitanTrust\System\Models\Concerns\TenantScoped;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkEvidenceItem extends Model
{
    use TenantScoped;

    protected $table = 'work_jobs_evidence';

    protected $fillable = [
        'company_id',
        'user_id',
        'job_id',
        'job_item_id',
        'incident_id',
        'site_id',
        'evidence_type',
        'caption',
        'tags',
        'search_text',
        'file_id',
        'captured_by_user_id',
        'captured_at',
        'captured_lat',
        'captured_lng',
        'captured_accuracy_m',
        'captured_source',
        'trust_level',
        'trust_flags',
    ];

    protected $casts = [
        'tags' => 'array',
        'captured_at' => 'datetime',
        'trust_flags' => 'array',
    ];

    public function file(): BelongsTo
    {
        return $this->belongsTo(WorkEvidenceFile::class, 'file_id');
    }
}
