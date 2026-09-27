<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Models;

use Illuminate\Database\Eloquent\Model;
use App\Extensions\TitanTrust\System\Models\Concerns\TenantScoped;

class WorkEvidenceRule extends Model
{
    use TenantScoped;

    protected $table = 'work_jobs_evidence_rules';

    protected $fillable = [
        'company_id',
        'user_id',
        'template_id',
        'job_type',
        'site_type',
        'required',
    ];

    protected $casts = [
        'required' => 'array',
    ];
}
