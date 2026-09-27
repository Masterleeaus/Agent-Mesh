<?php
namespace App\Extensions\Chatbot\System\Models;
use Illuminate\Database\Eloquent\Model;
class ChatbotSyncCursor extends Model { protected $table='ext_chatbot_sync_cursors'; protected $guarded=[]; protected $casts=['last_pulled_at'=>'datetime']; }
