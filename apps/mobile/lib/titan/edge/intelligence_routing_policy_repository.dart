import 'intelligence_routing_policy.dart';

abstract class TitanIntelligenceRoutingPolicyRepository {
  Future<TitanIntelligenceRoutingPolicy?> load();
  Future<void> apply(TitanIntelligenceRoutingPolicy policy);
}

class TitanInMemoryIntelligenceRoutingPolicyRepository
    implements TitanIntelligenceRoutingPolicyRepository {
  final String companyId;
  TitanIntelligenceRoutingPolicy? _value;

  TitanInMemoryIntelligenceRoutingPolicyRepository({required this.companyId});

  @override
  Future<TitanIntelligenceRoutingPolicy?> load() async=>_value;

  @override
  Future<void> apply(TitanIntelligenceRoutingPolicy policy) async{
    if(policy.companyId!=companyId){
      throw StateError('intelligence_policy_company_mismatch');
    }
    final current=_value;
    if(current!=null&&policy.version<=current.version){
      throw StateError('intelligence_policy_version_not_monotonic');
    }
    _value=policy;
  }
}
