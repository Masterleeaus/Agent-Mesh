import '../models/generated_ui_envelope.dart';
import '../models/generative_item.dart';

class TitanGeneratedUiRuntimeBridge {
  static const canonicalSurfaces={'zero','go','hub'};

  List<TitanGenerativeItem> project({
    required TitanGeneratedUiEnvelope envelope,
    required String companyId,
    required String surface,
    bool home=false,
  }) {
    if(envelope.schema!='titan.generated-ui.v1')throw StateError('unsupported generated UI schema');
    if(companyId.trim().isEmpty||envelope.companyId!=companyId)throw StateError('generated UI company_id mismatch');
    if(!canonicalSurfaces.contains(surface)||envelope.surface!=surface)throw StateError('generated UI surface mismatch');
    if(envelope.viewId.trim().isEmpty)throw StateError('generated UI view_id required');
    if(envelope.builderArtifactId.trim().isEmpty)throw StateError('Builder provenance required');
    if(envelope.interfaceRuntimeId.trim().isEmpty)throw StateError('Interface Runtime provenance required');
    if(envelope.visualRuntimeId.trim().isEmpty)throw StateError('Visual Runtime provenance required');
    if(envelope.governanceEvidence.containsKey('tenant_company_id')||envelope.governanceEvidence.containsKey('tenant_id'))throw StateError('generated UI legacy tenant boundary forbidden');
    final projected=envelope.items.where((item){
      if(item.title.trim().isEmpty)throw StateError('generated UI item title required');
      if(item.context.containsKey('tenant_company_id')||item.context.containsKey('tenant_id'))throw StateError('generated UI legacy tenant boundary forbidden');
      final itemCompany=item.context['company_id']?.toString();
      final itemSurface=item.context['surface']?.toString();
      if(itemCompany!=null&&itemCompany.isNotEmpty&&itemCompany!=companyId)return false;
      if(itemSurface!=null&&itemSurface.isNotEmpty&&itemSurface!=surface)return false;
      return true;
    }).map((item)=>item.copyWith(context:{
      ...item.context,
      'company_id':companyId,
      'surface':surface,
      'builder_artifact_id':envelope.builderArtifactId,
      'interface_runtime_id':envelope.interfaceRuntimeId,
      'visual_runtime_id':envelope.visualRuntimeId,
      'generated_ui_authority_neutral':true,
      'business_mutation_requires_command_bus':true,
    })).toList(growable:false);
    return home?projected.take(3).toList(growable:false):projected;
  }
}
