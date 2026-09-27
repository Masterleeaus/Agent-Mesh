<?php

namespace Modules\ComplianceIQ\Entities;

use Illuminate\Database\Eloquent\Model;
use Modules\ComplianceIQ\Traits\CompanyScoped;

class ComplianceAnnotation extends Model
{
    use CompanyScoped;
    protected $casts = ['finding_json' => 'array'];
    protected $fillable = [
        'company_id','report_id','user_id','kind','severity','note','finding_json'];
}
