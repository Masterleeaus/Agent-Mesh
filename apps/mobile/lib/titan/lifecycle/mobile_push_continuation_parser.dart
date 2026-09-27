import 'mobile_continuation_intent.dart';

class TitanMobilePushContinuationParser {
  const TitanMobilePushContinuationParser();
  TitanMobileContinuationIntent parse(Map<String,dynamic> data,{required DateTime now}){
    String value(String key)=>(data[key]??'').toString();
    final ttl=int.tryParse(value('ttl_seconds'))??300;
    if(ttl<1||ttl>900)throw StateError('push continuation ttl outside bounded window');
    return TitanMobileContinuationIntent(
      companyId:value('company_id'),surface:value('surface'),conversationId:value('conversation_id'),
      operationId:value('operation_id'),requestId:value('request_id'),correlationId:value('correlation_id'),
      capability:value('capability'),source:TitanContinuationSource.push,mutating:value('mutating')=='true',
      issuedAt:now,expiresAt:now.add(Duration(seconds:ttl)),payload:Map<String,dynamic>.from(data),
    );
  }
}
