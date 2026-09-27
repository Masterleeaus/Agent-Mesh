<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Models;

use Illuminate\Database\Eloquent\Model;
use App\Extensions\TitanTrust\System\Models\Concerns\TenantScoped;

class WorkEvidenceFile extends Model
{
    use TenantScoped;

    protected $table = 'work_jobs_evidence_files';

    protected $fillable = [
        'company_id',
        'user_id',
        'disk',
        'path',
        'original_name',
        'mime',
        'size',
        'sha256',
        'meta_json',
    ];

    protected $casts = [
        'meta_json' => 'array',
    ];
}
