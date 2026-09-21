import 'mobile_continuation_intent.dart';

class TitanMobileVoiceContinuation {
  const TitanMobileVoiceContinuation();
  TitanMobileContinuationIntent continueConversation({required TitanMobileContinuationIntent prior,required DateTime now}){
    if(!prior.usableAt(now))throw StateError('voice continuation context is stale');
    return TitanMobileContinuationIntent(
      companyId:prior.companyId,surface:prior.surface,conversationId:prior.conversationId,
      operationId:prior.operationId,requestId:prior.requestId,correlationId:prior.correlationId,
      capability:prior.capability,source:TitanContinuationSource.voice,mutating:prior.mutating,
      issuedAt:now,expiresAt:now.add(const Duration(minutes:5)),payload:prior.payload,
    );
  }
}
