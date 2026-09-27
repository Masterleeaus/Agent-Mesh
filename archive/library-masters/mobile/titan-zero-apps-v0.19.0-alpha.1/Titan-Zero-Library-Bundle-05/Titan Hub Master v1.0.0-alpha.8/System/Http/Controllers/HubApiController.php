<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Http\Controllers;

use App\Extensions\TitanHub\System\Contracts\CustomerOperationsGateway;
use App\Extensions\TitanHub\System\Contracts\HubPresentationBridge;
use App\Extensions\TitanHub\System\Security\HubProjectionGuard;
use App\Extensions\TitanHub\System\Integration\HubCapabilityDiscovery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class HubApiController
{
    public function __construct(private CustomerOperationsGateway $ops,private HubPresentationBridge $presentation,private HubProjectionGuard $guard,private HubCapabilityDiscovery $capabilities){}
    private function context(Request $r): array { return (array)$r->attributes->get('titan_hub_context',[]); }
    private function ok(mixed $data): JsonResponse { if(is_array($data))$data=$this->guard->assertSafe($data);return response()->json(['data'=>$data])->header('Cache-Control','private, no-store'); }
    public function home(Request $r):JsonResponse{return $this->ok($this->ops->home($this->context($r)));}
    public function services(Request $r):JsonResponse{return $this->ok($this->ops->services($this->context($r),$r->query()));}
    public function requests(Request $r):JsonResponse{return $this->ok($this->ops->serviceRequests($this->context($r),$r->query()));}
    public function createRequest(Request $r):JsonResponse{$p=$r->validate(['service_id'=>'nullable|string|max:191','location_id'=>'nullable|string|max:191','description'=>'required|string|max:5000','preferred_at'=>'nullable|date','idempotency_key'=>'required|string|max:191']);return $this->ok($this->ops->createServiceRequest($this->context($r),$p));}
    public function jobs(Request $r):JsonResponse{return $this->ok($this->ops->jobs($this->context($r),$r->query()));}
    public function job(Request $r,string $portal,string $id):JsonResponse{return $this->ok($this->ops->job($this->context($r),$id));}
    public function bookings(Request $r):JsonResponse{return $this->ok($this->ops->bookings($this->context($r),$r->query()));}
    public function bookingChange(Request $r,string $portal,string $id):JsonResponse{$p=$r->validate(['requested_at'=>'nullable|date','reason'=>'nullable|string|max:2000','idempotency_key'=>'required|string|max:191']);return $this->ok($this->ops->requestBookingChange($this->context($r),$id,$p));}
    public function quotes(Request $r):JsonResponse{return $this->ok($this->ops->quotes($this->context($r),$r->query()));}
    public function quote(Request $r,string $portal,string $id):JsonResponse{return $this->ok($this->ops->quote($this->context($r),$id));}
    public function approveQuote(Request $r,string $portal,string $id):JsonResponse{$p=$r->validate(['idempotency_key'=>'required|string|max:191','session_id'=>'nullable|string|max:191']);return $this->ok($this->ops->approveQuote($this->context($r),$id,$p));}
    public function invoices(Request $r):JsonResponse{return $this->ok($this->ops->invoices($this->context($r),$r->query()));}
    public function invoice(Request $r,string $portal,string $id):JsonResponse{return $this->ok($this->ops->invoice($this->context($r),$id));}
    public function documents(Request $r):JsonResponse{return $this->ok($this->ops->documents($this->context($r),$r->query()));}
    public function profile(Request $r):JsonResponse{return $this->ok($this->ops->profile($this->context($r)));}
    public function capabilities(Request $r):JsonResponse{return $this->ok($this->capabilities->report());}
    public function interface(Request $r,string $portal,string $workspace):JsonResponse{$projection=match($workspace){'home'=>$this->ops->home($this->context($r)),'book'=>['services'=>$this->ops->services($this->context($r))],'inbox'=>['threads'=>$this->ops->support($this->context($r))],'more'=>$this->ops->profile($this->context($r)),default=>[]};$projection['_hub']=$this->capabilities->report();return $this->ok($this->presentation->compose($workspace,$this->context($r),$this->guard->assertSafe($projection)));}
    public function interact(Request $r):JsonResponse{$p=$r->validate(['text'=>'nullable|string|max:10000','intent'=>'nullable|string|max:191','input'=>'nullable|array']);return $this->ok($this->presentation->interaction($this->context($r),$p));}
}
