import 'dart:async';
import 'device_intelligence_provider.dart';
import 'device_model_store_service.dart';
import 'llama_cpp_on_device_provider.dart';
import 'edge_capability_probe.dart';
import 'edge_execution_provenance_repository.dart';
import 'edge_node_identity.dart';
import 'edge_node_identity_service.dart';
import 'edge_resource_monitor.dart';
import 'edge_storage_manifest_repository.dart';
import 'edge_storage_policy_service.dart';
import 'storage_fabric_status_service.dart';
import 'storage_recovery_planner.dart';
import 'storage_fabric_executor.dart';
import 'storage_adapter_registry.dart';
import 'mobile_storage_topology_projector.dart';
import 'storage_fabric_topology_repository.dart';
import 'storage_fabric_topology.dart';
import 'edge_workload_executor.dart';
import 'local_model_registry_repository.dart';
import 'local_model_descriptor.dart';
import 'knowledge_authority_sync_record.dart';
import 'knowledge_authority_sync_state_repository.dart';
import 'knowledge_authority_sync_coordinator.dart';
import 'knowledge_authority_sync_envelope.dart';
import 'knowledge_authority_sync_service.dart';
import 'hybrid_local_rag_service.dart';
import 'local_vector_search_service.dart';
import 'local_vector_repository.dart';
import 'local_embedding_provider.dart';
import 'llama_cpp_embedding_provider.dart';
import 'local_model_pack_verifier.dart';
import 'local_model_pack_manifest.dart';
import 'local_bridge_peer_repository.dart';
import 'local_bridge_peer.dart';
import 'local_rag_query_service.dart';
import 'local_rag_repository.dart';
import 'mobile_edge_snapshot.dart';
import 'private_intelligence_route.dart';
import 'canonical_intelligence_router.dart';
import 'intelligence_routing_policy.dart';
import 'intelligence_routing_policy_repository.dart';
import 'edge_control_plane_supervisor.dart';
import 'edge_control_plane_status.dart';
import 'edge_node_advertisement.dart';
import '../services/mobile_operation_journal.dart';
import 'local_bridge_authorized_transport.dart';
import 'local_bridge_discovery.dart';
import 'local_bridge_discovery_service.dart';
import 'local_bridge_health_service.dart';
import 'local_bridge_pairing_codec.dart';
import 'local_bridge_pairing_invite.dart';
import 'local_bridge_pairing_service.dart';
import 'local_bridge_secret_repository.dart';
import 'local_bridge_secure_pairing_service.dart';
import 'local_bridge_selector.dart';
import 'local_bridge_workload_client.dart';
import 'local_bridge_revocation_service.dart';
import 'edge_workload.dart';
import 'mobile_storage_adapter_factory.dart';
import 'storage_transfer_ticket.dart';
import '../services/titan_http_client.dart';
import '../services/evidence_vault_repository.dart';
import 'storage_fabric_evidence_export_service.dart';
import 'storage_restore_staging_service.dart';
import 'storage_restore_staging_repository.dart';

class TitanMobileEdgeRuntime {
  final String scopeKey;
  final String companyId;
  final String actorId;
  final String deviceId;
  final String surface;
  final TitanEdgeNodeIdentityService identityService;
  final TitanEdgeResourceMonitor resourceMonitor;
  final TitanLocalModelRegistryRepository modelRegistry;
  final TitanDeviceModelStoreService modelStore;
  final TitanEdgeStorageManifestRepository storageRepository;
  final TitanStorageFabricTopologyRepository storageTopologyRepository;
  final TitanMobileStoragePolicyService storagePolicy;
  final TitanLocalBridgePeerRepository bridgePeers;
  final TitanLocalRagRepository ragRepository;
  final TitanLocalVectorRepository vectorRepository;
  final TitanEdgeExecutionProvenanceRepository provenanceRepository;
  final TitanLocalBridgeSecretRepository bridgeSecrets;
  final TitanLocalBridgeDiscoveryService bridgeDiscovery;
  final TitanMobileOperationJournal? operationJournal;
  final TitanEdgeControlPlaneSupervisor? controlPlaneSupervisor;
  final TitanIntelligenceRoutingPolicyRepository intelligenceRoutingPolicyRepository;
  final TitanCanonicalIntelligenceRouter intelligenceRouter;

  TitanEdgeNodeIdentity? _identity;
  TitanEdgeControlPlaneStatus? _controlPlaneStatus;
  TitanOnDeviceIntelligenceProvider? _intelligenceProvider;
  TitanLocalEmbeddingProvider? _embeddingProvider;
  Timer? _controlPlanePulse;

  TitanMobileEdgeRuntime({
    required this.scopeKey,
    required this.companyId,
    required this.actorId,
    required this.deviceId,
    required this.surface,
    required this.identityService,
    required this.resourceMonitor,
    required this.modelRegistry,
    required this.modelStore,
    required this.storageRepository,
    required this.storageTopologyRepository,
    required this.storagePolicy,
    required this.bridgePeers,
    required this.ragRepository,
    required this.vectorRepository,
    required this.provenanceRepository,
    required this.bridgeSecrets,
    required this.bridgeDiscovery,
    this.operationJournal,
    this.controlPlaneSupervisor,
    required this.intelligenceRoutingPolicyRepository,
    this.intelligenceRouter=const TitanCanonicalIntelligenceRouter(),
  });

  TitanEdgeNodeIdentity get identity {
    final value=_identity;
    if(value==null){
      throw StateError('Titan Mobile Edge runtime is not initialized');
    }
    return value;
  }

  Future<TitanMobileEdgeSnapshot> initialize() async{
    var identity=await identityService.ensureIdentity();
    final resources=await resourceMonitor.sample();
    final models=await modelRegistry.all();

    final intelligence=_intelligenceProvider=
        TitanLlamaCppOnDeviceProvider(
          nodeId:identity.nodeId,
          registry:modelRegistry,
          modelStore:modelStore,
          resourceMonitor:resourceMonitor,
        );
    final embeddings=_embeddingProvider=
        TitanLlamaCppEmbeddingProvider(
          nodeId:identity.nodeId,
          registry:modelRegistry,
          modelStore:modelStore,
          resourceMonitor:resourceMonitor,
        );
    final capabilityProbe=TitanEdgeCapabilityProbe(
      intelligenceProvider:intelligence,
      embeddingProvider:embeddings,
    );
    final capabilities=await capabilityProbe.capabilities(
      resources:resources,
      models:models,
    );
    final fingerprint=await capabilityProbe.fingerprint(capabilities);
    if(identity.capabilityFingerprint!=fingerprint){
      identity=await identityService.updateCapabilityFingerprint(
        fingerprint,
      );
    }
    final supervisor=controlPlaneSupervisor;
    TitanEdgeControlPlaneStatus controlPlaneStatus;
    if(supervisor!=null){
      final synced=await supervisor.synchronize(
        resources:resources,
        capabilities:capabilities,
      );
      identity=synced.identity;
      controlPlaneStatus=synced.status;
    }else{
      if(identity.registrationState==TitanEdgeRegistrationState.active){
        identity=await identityService.contractRegistrationState(
          TitanEdgeRegistrationState.limited,
        );
      }
      controlPlaneStatus=TitanEdgeControlPlaneStatus(
        configured:false,
        reachable:false,
        canonicallyEnrolled:false,
        registrationState:identity.registrationState,
        nodeId:identity.nodeId,
        enrollmentId:'',
        reason:'canonical_edge_control_plane_not_configured',
      );
    }
    _identity=identity;
    _controlPlaneStatus=controlPlaneStatus;

    TitanStorageFabricTopology? storageTopology;
    try{
      storageTopology=await storageTopologyRepository.load();
    }catch(_){
      // Invalid/corrupt topology is never used. Mobile falls back to its
      // bounded non-canonical compatibility manifest until Core resyncs.
      storageTopology=null;
    }

    var storage=await storageRepository.load();
    if(storageTopology!=null){
      storage=const TitanMobileStorageTopologyProjector().project(
        topology:storageTopology,
        companyId:companyId,
        nodeId:identity.nodeId,
        surface:surface,
      );
      await storageRepository.save(storage);
    }else if(storage==null||
        storage.companyId!=companyId||
        storage.nodeId!=identity.nodeId){
      storage=storagePolicy.defaultManifest(
        companyId:companyId,
        nodeId:identity.nodeId,
        surface:surface,
      );
      storagePolicy.validate(storage);
      await storageRepository.save(storage);
    }else{
      storagePolicy.validate(storage);
    }

    final peers=await bridgePeers.all();
    final routingPolicy=await intelligenceRoutingPolicyRepository.load();
    final route=intelligenceRouter.plan(
      request:TitanIntelligenceRoutingRequest(
        companyId:companyId,
        dataClass:'interactive_assistance',
        containsPrivateData:surface=='hub',
        onDeviceAvailable:capabilities.any(
          (item)=>item.id=='device.llm.local'&&item.executable,
        ),
        trustedLocalBridgeAvailable:surface!='hub'&&peers.any(
          (peer)=>peer.usableAt(DateTime.now().toUtc()),
        ),
        // Provider availability is deliberately false until the canonical
        // Goal51 capability advertisement supplies a bound provider.
        byoProviderAvailable:false,
        customerServiceAvailable:false,
        titanEntitledAvailable:false,
        titanMeteredAvailable:false,
      ),
      policy:routingPolicy,
      now:DateTime.now().toUtc(),
    );

    return TitanMobileEdgeSnapshot(
      identity:identity,
      resources:resources,
      capabilities:capabilities,
      storage:storage,
      storageFabricTopology:storageTopology,
      models:models,
      localBridgePeers:peers,
      privateIntelligenceRoute:route,
      controlPlane:controlPlaneStatus,
      lastExecution:await provenanceRepository.latest(),
      generatedAt:DateTime.now().toUtc(),
    );
  }



  Future<TitanIntelligenceRoutingPolicy?> currentIntelligenceRoutingPolicy()=>
      intelligenceRoutingPolicyRepository.load();

  Future<TitanMobileEdgeSnapshot> applyIntelligenceRoutingPolicy(
    TitanIntelligenceRoutingPolicy policy,
  ) async{
    if(policy.companyId!=companyId){
      throw StateError('intelligence_policy_company_mismatch');
    }
    await intelligenceRoutingPolicyRepository.apply(policy);
    return initialize();
  }

  Future<TitanIntelligenceRoutePlan> planIntelligenceRoute({
    required String dataClass,
    required bool containsPrivateData,
    required bool byoProviderAvailable,
    required bool customerServiceAvailable,
    required bool titanEntitledAvailable,
    required bool titanMeteredAvailable,
  }) async{
    final resources=await resourceMonitor.sample();
    final models=await modelRegistry.all();
    final provider=_intelligenceProvider;
    final deviceAvailable=provider!=null&&models.isNotEmpty&&resources.heavyWorkloadAllowed;
    final peers=await bridgePeers.all();
    return intelligenceRouter.plan(
      request:TitanIntelligenceRoutingRequest(
        companyId:companyId,
        dataClass:dataClass,
        containsPrivateData:containsPrivateData,
        onDeviceAvailable:deviceAvailable,
        trustedLocalBridgeAvailable:surface!='hub'&&peers.any(
          (peer)=>peer.usableAt(DateTime.now().toUtc()),
        ),
        byoProviderAvailable:byoProviderAvailable,
        customerServiceAvailable:customerServiceAvailable,
        titanEntitledAvailable:titanEntitledAvailable,
        titanMeteredAvailable:titanMeteredAvailable,
      ),
      policy:await intelligenceRoutingPolicyRepository.load(),
      now:DateTime.now().toUtc(),
    );
  }

  Future<TitanStorageFabricTopology?> currentStorageTopology()=>
      storageTopologyRepository.load();

  Future<TitanMobileEdgeSnapshot> applyStorageTopology(
    TitanStorageFabricTopology topology,
  ) async{
    await storageTopologyRepository.apply(topology);
    return initialize();
  }

  Future<TitanMobileEdgeSnapshot> applyStorageTopologyPayload(
    Map<String,dynamic> payload,
  )=>applyStorageTopology(
    TitanStorageFabricTopology.fromJson(payload),
  );

  TitanStorageAdapterRegistry defaultStorageAdapters({
    required TitanStorageTransferTicketProvider ticketProvider,
    required TitanHttpClient httpClient,
  })=>const TitanMobileStorageAdapterFactory().build(
    scopeKey:scopeKey,
    ticketProvider:ticketProvider,
    httpClient:httpClient,
  );

  Future<TitanStorageFabricExecutor> storageExecutor(
    TitanStorageAdapterRegistry adapters,
  ) async{
    final topology=await storageTopologyRepository.load();
    if(topology==null){
      throw StateError('canonical Storage Fabric topology unavailable');
    }
    return TitanStorageFabricExecutor(
      companyId:companyId,
      topology:topology,
      adapters:adapters,
    );
  }

  Future<TitanStorageRecoveryPlan> storageRecoveryPlan(
    String dataClass,
  ) async{
    final topology=await storageTopologyRepository.load();
    if(topology==null){
      throw StateError('canonical Storage Fabric topology unavailable');
    }
    return const TitanStorageRecoveryPlanner().plan(
      topology:topology,
      dataClass:dataClass,
    );
  }

  Future<TitanStorageTransferReceipt> exportEvidenceToStorage({
    required TitanStorageAdapterRegistry adapters,
    required EvidenceVaultRepository evidence,
    required String evidenceId,
    required String operationId,
    String contentType='application/octet-stream',
  }) async{
    final executor=await storageExecutor(adapters);
    return TitanStorageFabricEvidenceExportService(
      companyId:companyId,
      evidence:evidence,
      storage:executor,
    ).export(
      evidenceId:evidenceId,
      operationId:operationId,
      contentType:contentType,
    );
  }

  Future<TitanStagedStorageRestore> stageStorageRestore({
    required TitanStorageAdapterRegistry adapters,
    required String restoreId,
    required String dataClass,
    required String objectId,
    required String operationId,
  }) async{
    final executor=await storageExecutor(adapters);
    return TitanStorageRestoreStagingService(
      storage:executor,
      staging:TitanStorageRestoreStagingRepository(
        scopeKey:scopeKey,
        companyId:companyId,
      ),
    ).stage(
      restoreId:restoreId,
      dataClass:dataClass,
      objectId:objectId,
      operationId:operationId,
    );
  }


  Future<Map<String,dynamic>> storageFabricStatus() async{
    final topology=await storageTopologyRepository.load();
    if(topology==null){
      return {
        'company_id':companyId,
        'available':false,
        'mobile_can_promote_canonical':false,
      };
    }
    return {
      'available':true,
      ...const TitanStorageFabricStatusService().summary(topology),
    };
  }

  Future<List<TitanLocalModelDescriptor>> installedLocalModels()=>
      modelRegistry.all();

  Future<TitanLocalModelDescriptor> installLocalModelPack({
    required String sourcePath,
    required TitanLocalModelPackManifest manifest,
    required TitanLocalModelPackVerifier verifier,
  }) async{
    final descriptor=await modelStore.installPack(
      sourcePath:sourcePath,
      manifest:manifest,
      verifier:verifier,
    );
    await initialize();
    return descriptor;
  }

  Future<TitanLocalModelDescriptor> installLocalModel({
    required String sourcePath,
    required String modelId,
    required String version,
    required String quantization,
    required String expectedSha256,
    required String source,
    List<String> tasks=const ['chat'],
    String promptFormat='chatml',
    int contextTokens=2048,
    int maxOutputTokens=256,
    int gpuLayers=0,
    double temperature=0.2,
    double topP=0.9,
    TitanResourceRequirement minimumResources=
        TitanResourceRequirement.moderate,
  }) async{
    final descriptor=await modelStore.install(
      sourcePath:sourcePath,
      modelId:modelId,
      version:version,
      format:'gguf',
      quantization:quantization,
      expectedSha256:expectedSha256,
      source:source,
      tasks:tasks,
      promptFormat:promptFormat,
      contextTokens:contextTokens,
      maxOutputTokens:maxOutputTokens,
      gpuLayers:gpuLayers,
      temperature:temperature,
      topP:topP,
      minimumResources:minimumResources,
    );
    await initialize();
    return descriptor;
  }

  Future<Map<String,bool>> verifyLocalModels()=>modelStore.verifyAll();

  Future<void> uninstallLocalModel(String modelId) async{
    await modelStore.uninstall(modelId);
    await initialize();
  }

  void startControlPlanePulse(){
    final supervisor=controlPlaneSupervisor;
    if(supervisor==null||_controlPlanePulse!=null)return;
    _controlPlanePulse=Timer.periodic(
      supervisor.config.heartbeatInterval,
      (_) async{
        try{
          await snapshot();
        }catch(_){
          // Heartbeat failures only contract availability through the
          // supervisor. Foreground UI must not crash on control-plane loss.
        }
      },
    );
  }

  void stopControlPlanePulse(){
    _controlPlanePulse?.cancel();
    _controlPlanePulse=null;
  }

  bool get controlPlanePulseRunning=>_controlPlanePulse!=null;

  Future<TitanMobileEdgeSnapshot> snapshot()=>initialize();

  TitanIntelligenceRoutePlan planIntelligenceRoute({
    required TitanMobileEdgeSnapshot snapshot,
    required bool byoProviderAvailable,
    required bool customerServiceAvailable,
    required bool titanEntitledAvailable,
    required bool titanMeteredAvailable,
    required TitanIntelligenceRoutePolicy policy,
  })=>const TitanPrivateIntelligenceRoutePlanner().plan(
    onDeviceAvailable:snapshot.localAiAvailable,
    trustedLocalBridgeAvailable:
        surface!='hub'&&snapshot.localBridgePeers.any(
          (peer)=>peer.usableAt(DateTime.now().toUtc()),
        ),
    byoProviderAvailable:byoProviderAvailable,
    customerServiceAvailable:customerServiceAvailable,
    titanEntitledAvailable:titanEntitledAvailable,
    titanMeteredAvailable:titanMeteredAvailable,
    policy:policy,
  );


  Future<List<TitanLocalBridgeDiscoveryCandidate>>
      discoverLocalBridges({
    List<String> pairingUris=const [],
  }){
    if(surface=='hub'){
      throw StateError(
        'Hub customer surface cannot discover private business Edge nodes',
      );
    }
    final explicit=pairingUris.isEmpty
        ?null
        :TitanExplicitPairingDiscoveryProvider(
            pairingUris:pairingUris,
            codec:const TitanLocalBridgePairingCodec(),
          );
    return TitanLocalBridgeDiscoveryService(
      mdns:bridgeDiscovery.mdns,
      explicitPairing:explicit,
    ).discover();
  }

  Future<TitanLocalBridgePeer> pairLocalBridgeUri({
    required String pairingUri,
    required String pairingCode,
  })=>pairLocalBridge(
    invite:const TitanLocalBridgePairingCodec().decode(pairingUri),
    pairingCode:pairingCode,
  );

  Future<TitanLocalBridgePeer> pairLocalBridge({
    required TitanLocalBridgePairingInvite invite,
    required String pairingCode,
  }) async{
    if(surface=='hub'){
      throw StateError(
        'Hub customer surface cannot pair private business Edge nodes',
      );
    }
    final node=identity;
    final verifier=TitanLocalBridgePairingService(
      companyId:companyId,
      peers:bridgePeers,
    );
    return TitanLocalBridgeSecurePairingService(
      companyId:companyId,
      actorId:actorId,
      deviceId:deviceId,
      surface:surface,
      mobileNodeId:node.nodeId,
      inviteVerifier:verifier,
      peers:bridgePeers,
      secrets:bridgeSecrets,
      operationJournal:operationJournal,
    ).pair(
      invite:invite,
      pairingCode:pairingCode,
    );
  }

  Future<TitanLocalBridgePeer> refreshLocalBridge(
    String nodeId,
  ) async{
    if(surface=='hub'){
      throw StateError(
        'Hub customer surface cannot inspect private business Edge nodes',
      );
    }
    final peer=await bridgePeers.byNodeId(nodeId);
    if(peer==null){
      throw StateError('Local Bridge peer not found');
    }
    final transport=TitanPairedLocalBridgeTransport(
      peer:peer,
      secrets:bridgeSecrets,
    );
    return TitanLocalBridgeHealthService(
      peers:bridgePeers,
      actorId:actorId,
      deviceId:deviceId,
      surface:surface,
      operationJournal:operationJournal,
    ).refresh(
      peer:peer,
      transport:transport,
    );
  }

  Future<void> revokeLocalBridge(String nodeId)=>
      TitanLocalBridgeRevocationService(
        peers:bridgePeers,
        secrets:bridgeSecrets,
        companyId:companyId,
        actorId:actorId,
        deviceId:deviceId,
        surface:surface,
        operationJournal:operationJournal,
      ).revoke(nodeId);

  Future<TitanEdgeWorkloadResult> executeLocalBridgeWorkload(
    TitanEdgeWorkloadRequest request,
  ) async{
    if(surface=='hub'){
      return TitanEdgeWorkloadResult(
        workloadId:request.workloadId,
        completed:false,
        retryable:false,
        reason:'hub_private_edge_execution_forbidden',
      );
    }
    if(request.companyId!=companyId){
      return TitanEdgeWorkloadResult(
        workloadId:request.workloadId,
        completed:false,
        retryable:false,
        reason:'company_scope_mismatch',
      );
    }

    var peers=await bridgePeers.all();
    final selector=const TitanLocalBridgeSelector();
    var peer=selector.select(
      peers:peers,
      capabilityId:request.capabilityId,
    );

    if(peer==null){
      for(final candidate in peers.where((item)=>item.usable)){
        try{
          await refreshLocalBridge(candidate.nodeId);
        }catch(_){
          // Stale/unreachable peers remain ineligible.
        }
      }
      peers=await bridgePeers.all();
      peer=selector.select(
        peers:peers,
        capabilityId:request.capabilityId,
      );
    }

    if(peer==null){
      return TitanEdgeWorkloadResult(
        workloadId:request.workloadId,
        completed:false,
        retryable:true,
        reason:'no_fresh_trusted_local_bridge',
      );
    }

    final transport=TitanPairedLocalBridgeTransport(
      peer:peer,
      secrets:bridgeSecrets,
    );
    return TitanLocalBridgeWorkloadClient(
      peer:peer,
      transport:transport,
      actorId:actorId,
      deviceId:deviceId,
      surface:surface,
      operationJournal:operationJournal,
    ).execute(request);
  }


  TitanHybridLocalRagService hybridRagService({
    String embeddingModelId='',
  })=>TitanHybridLocalRagService(
    lexical:TitanLocalRagQueryService(ragRepository),
    vector:TitanLocalVectorSearchService(vectorRepository),
    embeddings:_embeddingProvider??
        const UnavailableTitanLocalEmbeddingProvider(),
    embeddingModelId:embeddingModelId,
  );

  Future<List<TitanKnowledgeSyncOutcome>> synchronizeKnowledge(
    List<TitanKnowledgeAuthoritySyncRecord> records, {
    String embeddingModelId='',
  }) async{
    await initialize();
    return TitanKnowledgeAuthoritySyncService(
      companyId:companyId,
      surface:surface,
      documents:ragRepository,
      vectors:vectorRepository,
      embeddings:_embeddingProvider!,
      embeddingModelId:embeddingModelId,
    ).synchronize(records);
  }

  Future<TitanKnowledgeAuthoritySyncResult>
      applyKnowledgeAuthorityEnvelope(
    TitanKnowledgeAuthoritySyncEnvelope envelope, {
    String embeddingModelId='',
  }) async{
    await initialize();
    final service=TitanKnowledgeAuthoritySyncService(
      companyId:companyId,
      surface:surface,
      documents:ragRepository,
      vectors:vectorRepository,
      embeddings:_embeddingProvider!,
      embeddingModelId:embeddingModelId,
    );
    return TitanKnowledgeAuthoritySyncCoordinator(
      companyId:companyId,
      surface:surface,
      sync:service,
      state:TitanKnowledgeAuthoritySyncStateRepository(
        scopeKey:scopeKey,
        companyId:companyId,
        surface:surface,
      ),
    ).apply(envelope);
  }

  Future<TitanKnowledgeAuthoritySyncResult>
      applyKnowledgeAuthorityPayload(
    Map<String,dynamic> payload, {
    String embeddingModelId='',
  })=>applyKnowledgeAuthorityEnvelope(
    TitanKnowledgeAuthoritySyncEnvelope.fromJson(payload),
    embeddingModelId:embeddingModelId,
  );

  TitanMobileEdgeWorkloadExecutor workloadExecutor(){
    final provider=_intelligenceProvider;
    if(provider==null||_identity==null){
      throw StateError('Titan Mobile Edge runtime is not initialized');
    }
    return TitanMobileEdgeWorkloadExecutor(
      companyId:companyId,
      identity:()=>identity,
      controlPlaneStatus:(){
        final value=_controlPlaneStatus;
        if(value==null){
          throw StateError('Edge control-plane status unavailable');
        }
        return value;
      },
      intelligence:provider,
      rag:TitanLocalRagQueryService(ragRepository),
      hybridRag:hybridRagService(),
      provenance:provenanceRepository,
    );
  }
}
