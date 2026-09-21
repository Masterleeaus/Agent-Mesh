import 'generative_item.dart';

class TitanGeneratedUiEnvelope {
  final String schema;
  final String companyId;
  final String surface;
  final String viewId;
  final String builderArtifactId;
  final String interfaceRuntimeId;
  final String visualRuntimeId;
  final List<TitanGenerativeItem> items;
  final Map<String,dynamic> governanceEvidence;

  const TitanGeneratedUiEnvelope({
    this.schema='titan.generated-ui.v1',
    required this.companyId,
    required this.surface,
    required this.viewId,
    required this.builderArtifactId,
    required this.interfaceRuntimeId,
    required this.visualRuntimeId,
    required this.items,
    this.governanceEvidence=const {},
  });

  factory TitanGeneratedUiEnvelope.fromJson(Map<String,dynamic> json)=>TitanGeneratedUiEnvelope(
    schema:(json['schema']??'').toString(),
    companyId:(json['company_id']??'').toString(),
    surface:(json['surface']??'').toString(),
    viewId:(json['view_id']??'').toString(),
    builderArtifactId:(json['builder_artifact_id']??'').toString(),
    interfaceRuntimeId:(json['interface_runtime_id']??'').toString(),
    visualRuntimeId:(json['visual_runtime_id']??'').toString(),
    items:_parseItems(json['items']),
    governanceEvidence:Map<String,dynamic>.from((json['governance_evidence'] as Map?)??const {}),
  );
  static List<TitanGenerativeItem> _parseItems(dynamic rawItems) {
    if (rawItems is! List) {
      throw FormatException('generated UI items list required');
    }
    return rawItems.map((item) {
      if (item is! Map) {
        throw FormatException('generated UI item object required');
      }
      return TitanGenerativeItem.fromJson(Map<String,dynamic>.from(item));
    }).toList(growable:false);
  }
}
