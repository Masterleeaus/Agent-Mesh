<?php
namespace App\Extensions\Chatbot\System\Models;
use Illuminate\Database\Eloquent\Model;
class ChatbotSyncSession extends Model { protected $table='ext_chatbot_sync_sessions'; protected $guarded=[]; protected $casts=['started_at'=>'datetime','completed_at'=>'datetime']; }
