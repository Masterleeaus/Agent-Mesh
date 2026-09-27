<?php
namespace App\Extensions\Chatbot\System\Models;
use Illuminate\Database\Eloquent\Model;
class ChatbotSyncConflict extends Model { protected $table='ext_chatbot_sync_conflicts'; protected $guarded=[]; protected $casts=['local_record'=>'array','server_record'=>'array','resolved_record'=>'array','resolved_at'=>'datetime']; }
