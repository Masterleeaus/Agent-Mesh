<?php
namespace App\Extensions\Chatbot\System\Models;
use Illuminate\Database\Eloquent\Model;
class ChatbotSyncTombstone extends Model { protected $table='ext_chatbot_sync_tombstones'; protected $guarded=[]; protected $casts=['deleted_at'=>'datetime']; }
