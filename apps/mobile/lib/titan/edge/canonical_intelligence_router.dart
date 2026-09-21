import 'intelligence_routing_policy.dart';
import 'private_intelligence_route.dart';

class TitanIntelligenceRoutingRequest {
  final String companyId;
  final String dataClass;
  final bool containsPrivateData;
  final bool onDeviceAvailable;
  final bool trustedLocalBridgeAvailable;
  final bool byoProviderAvailable;
  final bool customerServiceAvailable;
  final bool titanEntitledAvailable;
  final bool titanMeteredAvailable;

  const TitanIntelligenceRoutingRequest({
    required this.companyId,
    required this.dataClass,
    required this.containsPrivateData,
    required this.onDeviceAvailable,
    required this.trustedLocalBridgeAvailable,
    required this.byoProviderAvailable,
    required this.customerServiceAvailable,
    required this.titanEntitledAvailable,
    required this.titanMeteredAvailable,
  });
}

class TitanCanonicalIntelligenceRouter {
  const TitanCanonicalIntelligenceRouter();

  TitanIntelligenceRoutePlan plan({
    required TitanIntelligenceRoutingRequest request,
    required TitanIntelligenceRoutingPolicy? policy,
    required DateTime now,
  }){
    if(policy==null||policy.companyId!=request.companyId||!policy.usableAt(now)){
      return _localOnly(request, 'canonical_intelligence_policy_unavailable');
    }
    if(!policy.permitsDataClass(request.dataClass)){
      return _localOnly(request, 'data_class_external_routing_prohibited');
    }
    final base=policy.routePolicy;
    final effective=request.containsPrivateData
        ?TitanIntelligenceRoutePolicy(
            allowLocalBridge:base.allowLocalBridge,
            allowByo:false,
            allowCustomerService:false,
            allowTitanEntitled:false,
            allowTitanMetered:false,
            explicitMeteredApproval:false,
            externalEgressAllowed:false,
          )
        :base;
    return const TitanPrivateIntelligenceRoutePlanner().plan(
      onDeviceAvailable:request.onDeviceAvailable,
      trustedLocalBridgeAvailable:request.trustedLocalBridgeAvailable,
      byoProviderAvailable:request.byoProviderAvailable,
      customerServiceAvailable:request.customerServiceAvailable,
      titanEntitledAvailable:request.titanEntitledAvailable,
      titanMeteredAvailable:request.titanMeteredAvailable,
      policy:effective,
    );
  }

  TitanIntelligenceRoutePlan _localOnly(
    TitanIntelligenceRoutingRequest request,
    String reason,
  ){
    final plan=const TitanPrivateIntelligenceRoutePlanner().plan(
      onDeviceAvailable:request.onDeviceAvailable,
      trustedLocalBridgeAvailable:request.trustedLocalBridgeAvailable,
      byoProviderAvailable:false,
      customerServiceAvailable:false,
      titanEntitledAvailable:false,
      titanMeteredAvailable:false,
      policy:const TitanIntelligenceRoutePolicy(
        allowLocalBridge:true,
        externalEgressAllowed:false,
      ),
    );
    return TitanIntelligenceRoutePlan(
      selected:plan.selected,
      candidates:plan.candidates,
      reason:plan.available?reason:plan.reason,
      requiresExplicitUserApproval:false,
    );
  }
}
