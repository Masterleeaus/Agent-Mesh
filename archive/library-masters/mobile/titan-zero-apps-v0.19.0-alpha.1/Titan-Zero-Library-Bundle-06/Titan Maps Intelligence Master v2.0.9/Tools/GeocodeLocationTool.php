<?php

declare(strict_types=1);
namespace App\Extensions\TitanMapsIntelligence\Tools;
use App\Extensions\TitanMapsIntelligence\Contracts\AuthorisedCompanyContext;
use App\Extensions\TitanMapsIntelligence\Contracts\PermissionAuthorizer;
use App\Extensions\TitanMapsIntelligence\DTO\GeocodeRequest;
use App\Extensions\TitanMapsIntelligence\Services\GeocodingService;
use App\Extensions\TitanMapsIntelligence\Services\GovernedSpatialCapabilityExecutor;
final class GeocodeLocationTool
{
 public function __construct(private readonly AuthorisedCompanyContext $context,private readonly PermissionAuthorizer $authorizer,private readonly GeocodingService $geocoding,private readonly GovernedSpatialCapabilityExecutor $governance){}
 public function execute(array $input): array{$input['execution_origin']='ai';
  $c=$this->context->companyId();$this->authorizer->authorize($this->context->userId(),$c,'titan-maps-intelligence.location.geocode');
  return $this->governance->execute('location.geocode',$input,function()use($input){$r=$this->geocoding->geocode(new GeocodeRequest((string)$input['address'],$input['language_code']??null,$input['region_code']??null));return ['provider'=>$r->provider,'latitude'=>$r->coordinates->latitude,'longitude'=>$r->coordinates->longitude,'formatted_address'=>$r->formattedAddress,'provider_place_id'=>$r->providerPlaceId,'precision'=>$r->precision,'address_components'=>$r->addressComponents];});
 }
}
