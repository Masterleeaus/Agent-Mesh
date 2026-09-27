<?php
namespace App\Extensions\Chatbot\System\Models;
use Illuminate\Database\Eloquent\Model;
class ChatbotSyncChange extends Model { protected $table='ext_chatbot_sync_changes'; protected $primaryKey='sync_sequence'; public $incrementing=true; protected $guarded=[]; protected $casts=['record'=>'array']; }
