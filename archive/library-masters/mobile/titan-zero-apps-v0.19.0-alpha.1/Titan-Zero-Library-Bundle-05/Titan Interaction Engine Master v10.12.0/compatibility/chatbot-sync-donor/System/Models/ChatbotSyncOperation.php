<?php
namespace App\Extensions\Chatbot\System\Models;
use Illuminate\Database\Eloquent\Model;
class ChatbotSyncOperation extends Model { protected $table='ext_chatbot_sync_operations'; protected $guarded=[]; protected $casts=['payload'=>'array','dependencies'=>'array','result'=>'array','client_created_at'=>'datetime','processed_at'=>'datetime']; }
