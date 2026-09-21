import 'mobile_continuation_intent.dart';

class TitanContinuationDecision {
  final bool renderAllowed;
  final bool executionAllowed;
  final bool requiresOnlineRevalidation;
  final String reason;
  const TitanContinuationDecision({required this.renderAllowed,required this.executionAllowed,required this.requiresOnlineRevalidation,required this.reason});
}

class TitanMobileContinuationGate {
  const TitanMobileContinuationGate();
  TitanContinuationDecision evaluate({
    required TitanMobileContinuationIntent intent,
    required String companyId,
    required String surface,
    required bool online,
    required DateTime now,
  }){
    if(intent.companyId!=companyId)return const TitanContinuationDecision(renderAllowed:false,executionAllowed:false,requiresOnlineRevalidation:true,reason:'company_scope_mismatch');
    if(intent.canonicalSurface!=surface)return const TitanContinuationDecision(renderAllowed:false,executionAllowed:false,requiresOnlineRevalidation:true,reason:'surface_scope_mismatch');
    if(!intent.usableAt(now))return const TitanContinuationDecision(renderAllowed:false,executionAllowed:false,requiresOnlineRevalidation:true,reason:'continuation_expired_or_invalid');
    if(intent.mutating){
      return TitanContinuationDecision(renderAllowed:true,executionAllowed:false,requiresOnlineRevalidation:true,reason:online?'command_bus_revalidation_required':'offline_mutation_prohibited');
    }
    return const TitanContinuationDecision(renderAllowed:true,executionAllowed:true,requiresOnlineRevalidation:false,reason:'bounded_continuation_allowed');
  }
}
