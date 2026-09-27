<?php
namespace App\Extensions\Chatbot\System\Models;
use Illuminate\Database\Eloquent\Model;
class ChatbotSyncAcknowledgement extends Model { protected $table='ext_chatbot_sync_acknowledgements'; protected $guarded=[]; protected $casts=['acknowledged_at'=>'datetime']; }
