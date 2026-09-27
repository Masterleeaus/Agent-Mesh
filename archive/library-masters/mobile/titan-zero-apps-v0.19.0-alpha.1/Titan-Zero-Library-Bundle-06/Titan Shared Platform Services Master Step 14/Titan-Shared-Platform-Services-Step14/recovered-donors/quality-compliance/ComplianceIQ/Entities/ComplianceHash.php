<?php

namespace Modules\ComplianceIQ\Entities;

use Illuminate\Database\Eloquent\Model;
use Modules\ComplianceIQ\Traits\CompanyScoped;

class ComplianceHash extends Model
{
    use CompanyScoped;
    public $timestamps = false;
    protected $fillable = ['company_id','hashable_type','hashable_id','sha256','computed_at','status'];
    protected $casts = ['computed_at' => 'datetime'];
}
