import 'mobile_continuation_intent.dart';

class TitanMobileDeepLinkParser {
  const TitanMobileDeepLinkParser();
  TitanMobileContinuationIntent parse(Uri uri,{required DateTime now}){
    if(uri.scheme!='titan'&&uri.scheme!='https')throw StateError('unsupported deep link scheme');
    final q=uri.queryParameters;
    const allowed={'company_id','surface','conversation_id','operation_id','request_id','correlation_id','capability','mutating','ttl_seconds'};
    if(q.keys.any((key)=>!allowed.contains(key)))throw StateError('deep link contains unsupported parameters');
    final ttl=int.tryParse(q['ttl_seconds']??'300')??300;
    if(ttl<1||ttl>900)throw StateError('deep link ttl outside bounded window');
    return TitanMobileContinuationIntent(
      companyId:q['company_id']??'',surface:q['surface']??'',conversationId:q['conversation_id']??'',
      operationId:q['operation_id']??'',requestId:q['request_id']??'',correlationId:q['correlation_id']??'',
      capability:q['capability']??'',source:TitanContinuationSource.deepLink,mutating:q['mutating']=='true',
      issuedAt:now,expiresAt:now.add(Duration(seconds:ttl)),
    );
  }
}
