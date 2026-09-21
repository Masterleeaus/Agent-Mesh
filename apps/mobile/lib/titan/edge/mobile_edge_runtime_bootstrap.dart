import 'edge_execution_provenance_repository.dart';
import 'edge_node_identity_repository.dart';
import 'edge_node_identity_service.dart';
import 'edge_resource_monitor.dart';
import 'edge_storage_manifest_repository.dart';
import 'edge_storage_policy_service.dart';
import 'storage_fabric_topology_repository.dart';
import 'local_model_registry_repository.dart';
import 'device_model_store_service.dart';
import 'local_bridge_peer_repository.dart';
import 'local_rag_repository.dart';
import 'local_vector_repository.dart';
import 'mobile_edge_runtime.dart';
import 'edge_control_plane_bootstrap.dart';
import '../services/mobile_operation_journal.dart';
import 'local_bridge_secret_repository.dart';
import 'local_bridge_discovery_service.dart';
import 'intelligence_routing_policy_repository.dart';

class TitanMobileEdgeRuntimeBootstrap {
  static TitanMobileEdgeRuntime build({
    required String scopeKey,
    required String companyId,
    required String actorId,
    required String deviceId,
    required String surface,
    TitanMobileOperationJournal? operationJournal,
  }){
    final identityRepository=TitanEdgeNodeIdentityRepository(
      scopeKey:scopeKey,
    );
    final identityService=TitanEdgeNodeIdentityService(
      companyId:companyId,
      actorId:actorId,
      deviceId:deviceId,
      surface:surface,
      scopeKey:scopeKey,
      repository:identityRepository,
    );
    final controlPlane=
        TitanEdgeControlPlaneBootstrap.buildIfConfigured(
      scopeKey:scopeKey,
      companyId:companyId,
      actorId:actorId,
      deviceId:deviceId,
      surface:surface,
      identityService:identityService,
      operationJournal:operationJournal,
    );
    final modelRegistry=TitanLocalModelRegistryRepository(
      scopeKey:scopeKey,
    );
    final modelStore=TitanDeviceModelStoreService(
      registry:modelRegistry,
    );
    return TitanMobileEdgeRuntime(
      scopeKey:scopeKey,
      companyId:companyId,
      actorId:actorId,
      deviceId:deviceId,
      surface:surface,
      identityService:identityService,
      resourceMonitor:const TitanEdgeResourceMonitor(),
      modelRegistry:modelRegistry,
      modelStore:modelStore,
      storageRepository:TitanEdgeStorageManifestRepository(
        scopeKey:scopeKey,
      ),
      storageTopologyRepository:TitanStorageFabricTopologyRepository(
        scopeKey:scopeKey,
        companyId:companyId,
      ),
      storagePolicy:const TitanMobileStoragePolicyService(),
      bridgePeers:TitanLocalBridgePeerRepository(
        scopeKey:scopeKey,
        companyId:companyId,
      ),
      ragRepository:TitanLocalRagRepository(
        scopeKey:scopeKey,
        companyId:companyId,
        surface:surface,
      ),
      vectorRepository:TitanLocalVectorRepository(
        scopeKey:scopeKey,
        companyId:companyId,
        surface:surface,
      ),
      provenanceRepository:TitanEdgeExecutionProvenanceRepository(
        scopeKey:scopeKey,
      ),
      bridgeSecrets:TitanLocalBridgeSecretRepository(
        scopeKey:scopeKey,
        companyId:companyId,
      ),
      bridgeDiscovery:const TitanLocalBridgeDiscoveryService(),
      operationJournal:operationJournal,
      controlPlaneSupervisor:controlPlane,
      intelligenceRoutingPolicyRepository:
          TitanInMemoryIntelligenceRoutingPolicyRepository(companyId:companyId),
    );
  }
}
