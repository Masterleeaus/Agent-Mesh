<?php

declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Entities;
use Illuminate\Database\Eloquent\Model;
final class AssuranceAuditEvent extends Model {
 protected $table='titan_assurance_audit_events'; public $incrementing=false; protected $primaryKey='event_id'; protected $keyType='string';
 protected $guarded=[]; protected $casts=['evidence_json'=>'array','metadata_json'=>'array','occurred_at'=>'datetime'];
}
