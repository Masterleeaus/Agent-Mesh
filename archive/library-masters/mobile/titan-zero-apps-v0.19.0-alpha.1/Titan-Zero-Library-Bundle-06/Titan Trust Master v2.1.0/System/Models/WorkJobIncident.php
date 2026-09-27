<?php

declare(strict_types=1);

namespace App\Extensions\TitanTrust\System\Models;

use Illuminate\Database\Eloquent\Model;
use App\Extensions\TitanTrust\System\Models\Concerns\TenantScoped;

class WorkJobIncident extends Model
{
    use TenantScoped;

    protected $table = 'work_jobs_incidents';

    protected $fillable = [
        'company_id',
        'user_id',
        'job_id',
        'job_item_id',
        'incident_type',
        'severity',
        'status',
        'title',
        'description',
        'reported_by_user_id',
        'reported_at',
        'resolved_at',
        'resolved_by_user_id',
        'resolution_notes',
    ];

    protected $casts = [
        'reported_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];
}
