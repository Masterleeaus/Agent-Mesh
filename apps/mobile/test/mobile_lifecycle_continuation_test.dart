import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/lifecycle/mobile_continuation_gate.dart';
import 'package:titan_mobile_mvp/titan/lifecycle/mobile_continuation_intent.dart';
import 'package:titan_mobile_mvp/titan/lifecycle/mobile_deep_link_parser.dart';
import 'package:titan_mobile_mvp/titan/lifecycle/mobile_background_refresh_policy.dart';

void main(){
  final now=DateTime.utc(2026,9,20,12);
  test('cross company continuation fails closed',(){
    final i=TitanMobileContinuationIntent(companyId:'a',surface:'go',conversationId:'c',operationId:'o',requestId:'r',correlationId:'x',capability:'field.team.conversation',source:TitanContinuationSource.push,mutating:false,issuedAt:now,expiresAt:now.add(const Duration(minutes:5)));
    final d=const TitanMobileContinuationGate().evaluate(intent:i,companyId:'b',surface:'go',online:true,now:now);
    expect(d.renderAllowed,false);
  });
  test('mutation never executes directly from lifecycle event',(){
    final i=TitanMobileContinuationIntent(companyId:'a',surface:'go',conversationId:'c',operationId:'o',requestId:'r',correlationId:'x',capability:'job.update',source:TitanContinuationSource.push,mutating:true,issuedAt:now,expiresAt:now.add(const Duration(minutes:5)));
    final d=const TitanMobileContinuationGate().evaluate(intent:i,companyId:'a',surface:'go',online:true,now:now);
    expect(d.executionAllowed,false); expect(d.requiresOnlineRevalidation,true);
  });
  test('deep link rejects arbitrary parameters',(){
    expect(()=>const TitanMobileDeepLinkParser().parse(Uri.parse('titan://continue?company_id=a&surface=go&evil=x'),now:now),throwsStateError);
  });
  test('background refresh cannot mutate business state',(){
    expect(const TitanMobileBackgroundRefreshPolicy().mayExecuteBusinessMutation,false);
  });
}
