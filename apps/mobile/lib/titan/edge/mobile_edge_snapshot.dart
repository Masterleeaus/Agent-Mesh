import 'edge_node_identity.dart';
import 'edge_node_capability.dart';
import 'edge_resource_snapshot.dart';
import 'edge_storage_manifest.dart';
import 'storage_fabric_topology.dart';
import 'local_model_descriptor.dart';
import 'edge_execution_provenance.dart';
import 'local_bridge_peer.dart';
import 'private_intelligence_route.dart';
import 'edge_control_plane_status.dart';

class TitanMobileEdgeSnapshot {
  final TitanEdgeNodeIdentity identity;
  final TitanEdgeResourceSnapshot resources;
  final List<TitanEdgeNodeCapability> capabilities;
  final TitanMobileStorageManifest storage;
  final TitanStorageFabricTopology? storageFabricTopology;
  final List<TitanLocalModelDescriptor> models;
  final List<TitanLocalBridgePeer> localBridgePeers;
  final TitanIntelligenceRoutePlan privateIntelligenceRoute;
  final TitanEdgeControlPlaneStatus controlPlane;
  final TitanEdgeExecutionProvenance? lastExecution;
  final DateTime generatedAt;

  const TitanMobileEdgeSnapshot({
    required this.identity,
    required this.resources,
    required this.capabilities,
    required this.storage,
    this.storageFabricTopology,
    required this.models,
    required this.localBridgePeers,
    required this.privateIntelligenceRoute,
    required this.controlPlane,
    required this.generatedAt,
    this.lastExecution,
  });

  bool get localAiAvailable=>capabilities.any(
    (capability)=>
      capability.id=='device.llm.local'&&capability.executable,
  );

  bool get localEmbeddingsAvailable=>capabilities.any(
    (capability)=>
      capability.id=='device.embedding.local'&&capability.executable,
  );

  int get executableCapabilityCount=>
      capabilities.where((item)=>item.executable).length;

  int get trustedLocalBridgeCount=>localBridgePeers
      .where((peer)=>peer.usableAt(generatedAt))
      .length;

  bool get storageTopologyAvailable=>storageFabricTopology!=null;

  bool get storageTopologyStale=>storageFabricTopology!=null&&
      generatedAt.difference(storageFabricTopology!.issuedAt.toUtc())>
          const Duration(hours:24);

  int get storageHealthyEndpointCount=>storageFabricTopology?.endpoints
      .where((endpoint)=>
        endpoint.state==TitanStorageEndpointState.healthy)
      .length??0;

  int get storageDegradedCanonicalCount{
    final topology=storageFabricTopology;
    if(topology==null)return 0;
    var count=0;
    for(final route in topology.routes){
      final canonical=topology.endpoint(route.canonicalEndpointId);
      if(canonical==null||
          canonical.state!=TitanStorageEndpointState.healthy){
        count++;
      }
    }
    return count;
  }
}
