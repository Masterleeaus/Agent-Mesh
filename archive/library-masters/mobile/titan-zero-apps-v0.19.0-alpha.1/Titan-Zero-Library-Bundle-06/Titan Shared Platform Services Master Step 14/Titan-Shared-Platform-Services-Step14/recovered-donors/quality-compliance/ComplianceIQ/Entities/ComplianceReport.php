<?php

namespace Modules\ComplianceIQ\Entities;

use Illuminate\Database\Eloquent\Model;
use Modules\ComplianceIQ\Traits\CompanyScoped;

class ComplianceReport extends Model
{
    use CompanyScoped;
    protected $fillable = [
        'company_id',
        'title','period_start','period_end','status',
        'signed_off_by','signed_off_at','filters','summary','integrity_root'
    ];
    protected $casts = [
        'filters' => 'array',
        'summary' => 'array',
        'period_start' => 'date',
        'period_end' => 'date',
        'signed_off_at' => 'datetime',
    ];

    public function annotations()
    {
        return $this->hasMany(ComplianceAnnotation::class, 'report_id');
    }
}
