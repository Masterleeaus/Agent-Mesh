<?php
declare(strict_types=1);

namespace App\Extensions\TitanAppsCore\System\Services;

use App\Extensions\TitanAppsCore\System\Contracts\AppSurface;

final class TitanAppsServiceWorkerFactory
{
    /**
     * Shared shell serviceWorker policy:
     * - app navigation/private API: network-first/no-store
     * - static GET assets: cache fallback
     * - never queues business mutations in the service worker
     */
    public function script(AppSurface $surface,string $scope,string $cacheVersion): string
    {
        $scope='/'.trim($scope,'/').'/';
        $cache='titan-'.$surface->value.'-shell-'.$cacheVersion;
        return "const SCOPE=".json_encode($scope).";const CACHE=".json_encode($cache).";\n".
            "self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE));self.skipWaiting();});\n".
            "self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});\n".
            "self.addEventListener('fetch',e=>{const r=e.request;const u=new URL(r.url);".
            "if(!u.pathname.startsWith(SCOPE))return;if(r.method!=='GET')return;".
            "const privateApi=u.pathname.includes('/api/');".
            "if(privateApi||r.mode==='navigate'){e.respondWith(fetch(r,{cache:'no-store'}));return;}".
            "e.respondWith(fetch(r).then(res=>{if(res.ok&&res.type==='basic'){const c=res.clone();caches.open(CACHE).then(x=>x.put(r,c));}return res;}).catch(()=>caches.match(r)));});";
    }
}
