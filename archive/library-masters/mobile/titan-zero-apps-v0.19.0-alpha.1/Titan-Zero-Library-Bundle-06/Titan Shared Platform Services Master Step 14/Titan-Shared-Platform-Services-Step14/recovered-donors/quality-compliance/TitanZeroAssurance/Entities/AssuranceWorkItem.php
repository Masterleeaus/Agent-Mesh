<?php
declare(strict_types=1);
namespace Modules\TitanZeroAssurance\Entities;
use Illuminate\Database\Eloquent\Model;
final class AssuranceWorkItem extends Model {protected $table='titan_assurance_work_items';protected $guarded=[];protected $casts=['required_capabilities'=>'array','payload_json'=>'array'];}
