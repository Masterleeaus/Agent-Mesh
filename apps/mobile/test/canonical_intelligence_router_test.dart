import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile/titan/edge/canonical_intelligence_router.dart';
import 'package:titan_mobile/titan/edge/intelligence_routing_policy.dart';
import 'package:titan_mobile/titan/edge/private_intelligence_route.dart';

void main(){
  const router=TitanCanonicalIntelligenceRouter();
  TitanIntelligenceRoutingRequest request({bool device=false,bool private=false})=>
      TitanIntelligenceRoutingRequest(companyId:'c1',dataClass:'chat',containsPrivateData:private,
        onDeviceAvailable:device,trustedLocalBridgeAvailable:false,byoProviderAvailable:true,
        customerServiceAvailable:true,titanEntitledAvailable:true,titanMeteredAvailable:true);
  TitanIntelligenceRoutingPolicy policy({bool meteredApproval=false})=>TitanIntelligenceRoutingPolicy(
    policyId:'p1',version:1,companyId:'c1',issuedAt:DateTime.utc(2026),
    routePolicy:TitanIntelligenceRoutePolicy(allowByo:true,allowTitanMetered:true,
      explicitMeteredApproval:meteredApproval,externalEgressAllowed:true));

  test('missing canonical policy fails closed to local only',(){
    final plan=router.plan(request:request(),policy:null,now:DateTime.utc(2026));
    expect(plan.selected,TitanIntelligenceRouteTier.unavailable);
  });
  test('canonical policy can select BYO before Titan',(){
    final plan=router.plan(request:request(),policy:policy(),now:DateTime.utc(2026));
    expect(plan.selected,TitanIntelligenceRouteTier.byoProvider);
  });
  test('private data cannot egress even when policy allows external',(){
    final plan=router.plan(request:request(private:true),policy:policy(),now:DateTime.utc(2026));
    expect(plan.selected,TitanIntelligenceRouteTier.unavailable);
  });
  test('device route wins over external routes',(){
    final plan=router.plan(request:request(device:true),policy:policy(),now:DateTime.utc(2026));
    expect(plan.selected,TitanIntelligenceRouteTier.onDevice);
  });
}
