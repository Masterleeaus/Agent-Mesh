import 'package:flutter_test/flutter_test.dart';
import 'package:titan_zero_mobile/titan/core/surface_contract.dart';

void main(){
  Map<String,dynamic> projection()=> {
    'company_id':'c1','surface':'command','actor_id':'owner','revision':'r1',
    'issued_at':'2026-09-22T00:00:00Z','expires_at':'2099-09-22T00:00:00Z',
    'authority_neutral':true,'identity_grants_authority':false,'cached_state_grants_authority':false,
    'capabilities':[{'capability_id':'decision.resolve','operations':['approve'],'mutation':true,'offline':'forbidden','requires_receipt':true}],
    'data':<String,dynamic>{},
  };
  test('command alias normalizes to canonical zero',(){
    expect(TitanSurfaceProjection.fromJson(projection()).surface,TitanSurface.zero);
  });
  test('legacy tenant authority fails closed',(){
    final json=projection()..['tenant_id']='legacy';
    expect(()=>TitanSurfaceProjection.fromJson(json),throwsFormatException);
  });
  test('unknown capability fails closed',(){
    final p=TitanSurfaceProjection.fromJson(projection());
    expect(()=>p.requireCapability('invoice.delete','delete'),throwsStateError);
  });
}
