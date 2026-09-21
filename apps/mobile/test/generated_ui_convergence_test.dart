import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile_mvp/titan/core_bridge/generated_ui_runtime_bridge.dart';
import 'package:titan_mobile_mvp/titan/models/generated_ui_envelope.dart';
import 'package:titan_mobile_mvp/titan/models/generative_item.dart';
import 'package:titan_mobile_mvp/titan/validation/generated_ui_convergence_contract.dart';

void main(){
  const bridge=TitanGeneratedUiRuntimeBridge();
  TitanGeneratedUiEnvelope envelope(int count)=>TitanGeneratedUiEnvelope(
    companyId:'c1',surface:'zero',viewId:'home',builderArtifactId:'builder-1',
    interfaceRuntimeId:'interface-runtime',visualRuntimeId:'visual-runtime',
    items:List.generate(count,(i)=>TitanGenerativeItem(type:TitanGenerativeType.notice,title:'Card $i')),
  );
  test('home projection is capped to exactly the three-card surface budget',(){
    final items=bridge.project(envelope:envelope(5),companyId:'c1',surface:'zero',home:true);
    expect(items.length,3);
    GeneratedUiConvergenceContract.validateHome(items,companyId:'c1',surface:'zero');
  });
  test('cross-company generated UI fails closed',(){
    expect(()=>bridge.project(envelope:envelope(1),companyId:'c2',surface:'zero',home:true),throwsStateError);
  });
  test('noncanonical surface fails closed',(){
    expect(()=>bridge.project(envelope:envelope(1),companyId:'c1',surface:'command',home:true),throwsStateError);
  });
}
