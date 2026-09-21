import '../services/evidence_upload_preflight.dart';
import 'storage_fabric_topology_repository.dart';
import 'storage_fabric_topology.dart';

class TitanStorageAwareEvidenceUploadPreflight
    implements TitanEvidenceUploadPreflight {
  final TitanEvidenceUploadPreflight delegate;
  final TitanStorageFabricTopologyRepository topologyRepository;
  final String dataClass;

  const TitanStorageAwareEvidenceUploadPreflight({
    required this.delegate,
    required this.topologyRepository,
    this.dataClass='field_evidence',
  });

  @override
  Future<String> ensureUploaded(String evidenceId) async{
    final topology=await topologyRepository.load();
    if(topology==null){
      throw StateError(
        'canonical Storage Fabric topology unavailable for evidence upload',
      );
    }
    final route=topology.route(dataClass);
    if(route==null||route.evidenceEndpointIds.isEmpty){
      throw StateError('no canonical evidence destination is authorised');
    }
    final healthy=route.evidenceEndpointIds.any((id){
      final endpoint=topology.endpoint(id);
      return endpoint!=null&&
          endpoint.state==TitanStorageEndpointState.healthy&&
          endpoint.roles.contains(TitanStorageFabricRole.evidence);
    });
    if(!healthy){
      throw StateError(
        'evidence remains staged because canonical evidence storage is unavailable',
      );
    }
    return delegate.ensureUploaded(evidenceId);
  }

  @override
  Future<void> markServerConfirmed(
    Iterable<String> evidenceIds,
  )=>delegate.markServerConfirmed(evidenceIds);
}
