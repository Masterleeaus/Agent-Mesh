<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

final class HubPwaController
{
    public function manifest(string $portal): JsonResponse
    {
        $base='/customer/'.rawurlencode($portal).'/';
        return response()->json([
            'name'=>config('hub.pwa.name','Titan Hub'),'short_name'=>config('hub.pwa.short_name','Hub'),
            'start_url'=>$base,'scope'=>$base,'display'=>config('hub.pwa.display','standalone'),
            'theme_color'=>config('hub.pwa.theme_color','#000000'),'background_color'=>config('hub.pwa.background_color','#000000'),
            'id'=>$base,'icons'=>[]
        ])->header('Cache-Control','public, max-age=3600');
    }

    public function serviceWorker(string $portal): Response
    {
        $base='/customer/'.rawurlencode($portal).'/';
        $static=$base.'assets/hub.js';
        $js="const SCOPE=".json_encode($base).";const STATIC=".json_encode($static).";const CACHE='titan-hub-static-v2';\n".
            "self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll([STATIC])));self.skipWaiting();});\n".
            "self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('titan-hub-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});\n".
            "self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;if(!u.pathname.startsWith(SCOPE))return;".
            "if(u.pathname.includes('/api/')||e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'no-store'}));return;}".
            "if(u.pathname===STATIC){e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request,{cache:'no-cache'})));}});";
        return response($js,200,['Content-Type'=>'application/javascript; charset=UTF-8','Service-Worker-Allowed'=>$base,'Cache-Control'=>'no-cache']);
    }
}