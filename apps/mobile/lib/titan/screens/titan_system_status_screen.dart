import 'package:flutter/material.dart';
import '../models/system_operational_status.dart';
import '../edge/mobile_edge_snapshot.dart';
import '../core_bridge/core_integration_status.dart';
import '../edge/local_bridge_discovery_service.dart';

typedef TitanSystemStatusLoader=
    Future<TitanSystemOperationalStatus> Function();
typedef TitanEdgeStatusLoader=
    Future<TitanMobileEdgeSnapshot> Function();
typedef TitanLocalBridgeDiscoveryLoader=
    Future<List<TitanLocalBridgeDiscoveryCandidate>> Function();
typedef TitanLocalBridgePairingHandler=
    Future<String> Function(String pairingUri,String pairingCode);

class TitanSystemStatusScreen extends StatefulWidget {
  final TitanSystemStatusLoader loadStatus;
  final TitanEdgeStatusLoader? loadEdgeStatus;
  final TitanLocalBridgeDiscoveryLoader? discoverLocalBridges;
  final TitanLocalBridgePairingHandler? pairLocalBridge;

  const TitanSystemStatusScreen({
    super.key,
    required this.loadStatus,
    this.loadEdgeStatus,
    this.discoverLocalBridges,
    this.pairLocalBridge,
  });

  @override
  State<TitanSystemStatusScreen> createState()=>
      _TitanSystemStatusScreenState();
}

class _TitanSystemStatusScreenState
    extends State<TitanSystemStatusScreen> {
  TitanSystemOperationalStatus? _status;
  TitanMobileEdgeSnapshot? _edgeStatus;
  Object? _error;
  Object? _bridgeDiscoveryError;
  bool _loading=true;
  bool _discoveringBridges=false;
  List<TitanLocalBridgeDiscoveryCandidate> _bridgeCandidates=const [];
  String _bridgePairingMessage='';

  @override
  void initState(){
    super.initState();
    _load();
  }

  Future<void> _load() async{
    if(mounted)setState((){
      _loading=true;
      _error=null;
    });
    try{
      final results=await Future.wait<dynamic>([
        widget.loadStatus(),
        if(widget.loadEdgeStatus!=null)
          widget.loadEdgeStatus!()
        else
          Future<TitanMobileEdgeSnapshot?>.value(null),
      ]);
      if(!mounted)return;
      setState((){
        _status=results[0] as TitanSystemOperationalStatus;
        _edgeStatus=results[1] as TitanMobileEdgeSnapshot?;
        _loading=false;
      });
    }catch(error){
      if(!mounted)return;
      setState((){
        _error=error;
        _loading=false;
      });
    }
  }

  Future<void> _pairBridge() async{
    final pair=widget.pairLocalBridge;
    if(pair==null)return;
    final uriController=TextEditingController();
    final codeController=TextEditingController();
    final values=await showDialog<List<String>>(
      context:context,
      builder:(context)=>AlertDialog(
        title:const Text('Pair private computer'),
        content:Column(
          mainAxisSize:MainAxisSize.min,
          children:[
            const Text(
              'Use the pairing link/QR payload and one-time code shown '
              'on the Titan computer. LAN discovery alone is never trusted.',
            ),
            const SizedBox(height:12),
            TextField(
              controller:uriController,
              autocorrect:false,
              enableSuggestions:false,
              decoration:const InputDecoration(
                labelText:'Pairing link',
                hintText:'titan://pair/local-bridge?...',
              ),
            ),
            const SizedBox(height:10),
            TextField(
              controller:codeController,
              autocorrect:false,
              enableSuggestions:false,
              obscureText:true,
              decoration:const InputDecoration(
                labelText:'One-time pairing code',
              ),
            ),
          ],
        ),
        actions:[
          TextButton(
            onPressed:()=>Navigator.pop(context),
            child:const Text('Cancel'),
          ),
          FilledButton(
            onPressed:()=>Navigator.pop(
              context,
              [uriController.text.trim(),codeController.text.trim()],
            ),
            child:const Text('Pair'),
          ),
        ],
      ),
    );
    uriController.dispose();
    codeController.dispose();
    if(values==null||values.length!=2||
        values[0].isEmpty||values[1].isEmpty){
      return;
    }
    setState(()=>_bridgePairingMessage='Pairing…');
    try{
      final message=await pair(values[0],values[1]);
      if(!mounted)return;
      setState(()=>_bridgePairingMessage=message);
      await _load();
    }catch(error){
      if(!mounted)return;
      setState(
        ()=>_bridgePairingMessage='Pairing failed: $error',
      );
    }
  }

  Future<void> _discoverBridges() async{
    final discover=widget.discoverLocalBridges;
    if(discover==null||_discoveringBridges)return;
    setState((){
      _discoveringBridges=true;
      _bridgeDiscoveryError=null;
    });
    try{
      final candidates=await discover();
      if(!mounted)return;
      setState((){
        _bridgeCandidates=candidates;
        _discoveringBridges=false;
      });
    }catch(error){
      if(!mounted)return;
      setState((){
        _bridgeDiscoveryError=error;
        _discoveringBridges=false;
      });
    }
  }

  IconData _stateIcon(String state)=>switch(state){
    'healthy'=>Icons.verified_outlined,
    'canary_limited'=>Icons.science_outlined,
    'rollback_guarded'=>Icons.shield_outlined,
    'degraded'=>Icons.warning_amber_outlined,
    'local_only'=>Icons.phone_android_outlined,
    _=>Icons.help_outline,
  };

  String _stateLabel(String state)=>switch(state){
    'healthy'=>'Healthy',
    'canary_limited'=>'Canary limited',
    'rollback_guarded'=>'Rollback guarded',
    'degraded'=>'Degraded',
    'local_only'=>'Local only',
    _=>'Unknown',
  };

  @override
  Widget build(BuildContext context){
    final status=_status;
    return Scaffold(
      appBar:AppBar(
        title:const Text('System'),
        actions:[
          IconButton(
            tooltip:'Refresh system status',
            onPressed:_loading?null:_load,
            icon:const Icon(Icons.refresh_outlined),
          ),
        ],
      ),
      body:_loading&&status==null
          ?const Center(child:CircularProgressIndicator())
          :_error!=null&&status==null
              ?_ErrorState(error:_error!,onRetry:_load)
              :RefreshIndicator(
                  onRefresh:_load,
                  child:ListView(
                    padding:const EdgeInsets.all(16),
                    children:[
                      _StatusHeader(
                        icon:_stateIcon(status!.state),
                        label:_stateLabel(status.state),
                        summary:status.summary,
                      ),
                      const SizedBox(height:12),
                      _MetricCard(
                        title:'Production access',
                        rows:{
                          'Traffic':status.trafficOpen?'Open':'Constrained',
                          'Rollout':status.rolloutMode.replaceAll('_',' '),
                          if(status.rolloutReason.isNotEmpty)
                            'Reason':status.rolloutReason.replaceAll('_',' '),
                          'Live telemetry':status.live?'Connected':'Not configured',
                        },
                      ),
                      const SizedBox(height:12),
                      _MetricCard(
                        title:'Runtime safety',
                        rows:{
                          'Rollback guard':
                              status.runtimeGuardTripped?'Tripped':'Clear',
                          if(status.runtimeGuardReason.isNotEmpty)
                            'Guard reason':
                                status.runtimeGuardReason.replaceAll('_',' '),
                          'Queue workers':
                              status.workerHeartbeatsPassed?'Healthy':'Needs attention',
                          'Company health':
                              status.companyHealthPassed?'Healthy':'Degraded',
                        },
                      ),
                      const SizedBox(height:12),
                      _MetricCard(
                        title:'Failure budget',
                        rows:{
                          'State':status.failureBudgetPassed?'Within budget':'Exhausted',
                          'Requests':'${status.failureBudgetRequests}',
                          'Failures':'${status.failureBudgetFailures}',
                          'Failure rate':
                              '${(status.failureRate*100).toStringAsFixed(1)}%',
                        },
                      ),
                      const SizedBox(height:12),
                      _MetricCard(
                        title:'Propagation',
                        rows:{
                          'Projection lag':'${status.projectionLag}',
                          'Pending':'${status.pendingPropagation}',
                          'Failures':'${status.propagationFailures}',
                        },
                      ),
                      if(_edgeStatus!=null)...[
                        const SizedBox(height:12),
                        _EdgeNodeCard(snapshot:_edgeStatus!),
                      ],
                      if(widget.discoverLocalBridges!=null)...[
                        const SizedBox(height:12),
                        _LocalBridgeDiscoveryCard(
                          candidates:_bridgeCandidates,
                          discovering:_discoveringBridges,
                          error:_bridgeDiscoveryError,
                          pairingMessage:_bridgePairingMessage,
                          onDiscover:_discoverBridges,
                          onPair:widget.pairLocalBridge==null
                              ?null
                              :_pairBridge,
                        ),
                      ],
                      const SizedBox(height:12),
                      Text(
                        'Open incidents',
                        style:Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height:8),
                      if(status.openIncidents.isEmpty)
                        const Card(
                          child:ListTile(
                            leading:Icon(Icons.check_circle_outline),
                            title:Text('No open mobile incidents'),
                          ),
                        )
                      else
                        ...status.openIncidents.map(
                          (incident)=>Card(
                            child:ListTile(
                              leading:const Icon(
                                Icons.report_problem_outlined,
                              ),
                              title:Text(incident.summary),
                              subtitle:Text([
                                incident.severity,
                                incident.incidentType
                                    .replaceAll('_',' '),
                                if(incident.correlationId.isNotEmpty)
                                  'Correlation ${incident.correlationId}',
                              ].join(' · ')),
                            ),
                          ),
                        ),
                      if(status.correlationId.isNotEmpty)...[
                        const SizedBox(height:12),
                        Text(
                          'Status correlation: ${status.correlationId}',
                          style:Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ],
                  ),
                ),
    );
  }
}

class _StatusHeader extends StatelessWidget {
  final IconData icon;
  final String label;
  final String summary;
  const _StatusHeader({
    required this.icon,
    required this.label,
    required this.summary,
  });

  @override
  Widget build(BuildContext context)=>Card(
    child:Padding(
      padding:const EdgeInsets.all(16),
      child:Row(
        crossAxisAlignment:CrossAxisAlignment.start,
        children:[
          Icon(icon,size:32),
          const SizedBox(width:12),
          Expanded(
            child:Column(
              crossAxisAlignment:CrossAxisAlignment.start,
              children:[
                Text(
                  label,
                  style:Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height:4),
                Text(summary),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _EdgeNodeCard extends StatelessWidget {
  final TitanMobileEdgeSnapshot snapshot;
  const _EdgeNodeCard({required this.snapshot});

  String _shortNodeId(String value){
    if(value.length<=18)return value;
    return '${value.substring(0,10)}…${value.substring(value.length-6)}';
  }

  String _routeLabel(String value)=>switch(value){
    'onDevice'=>'This device',
    'localBridge'=>'Trusted local computer',
    'byoProvider'=>'Your provider',
    'customerService'=>'Your connected service',
    'titanEntitled'=>'Titan System AI · included',
    'titanMetered'=>'Titan metered · approved',
    _=>'No permitted route',
  };

  @override
  Widget build(BuildContext context){
    final identity=snapshot.identity;
    final resources=snapshot.resources;
    final localCopies=snapshot.storage.entries.length;
    final executableModels=
        snapshot.models.where((model)=>model.executable).length;
    return Card(
      child:Padding(
        padding:const EdgeInsets.all(16),
        child:Column(
          crossAxisAlignment:CrossAxisAlignment.start,
          children:[
            Row(
              children:[
                const Icon(Icons.phone_android_outlined),
                const SizedBox(width:8),
                Expanded(
                  child:Text(
                    'This device · Edge Node',
                    style:Theme.of(context).textTheme.titleMedium,
                  ),
                ),
              ],
            ),
            const SizedBox(height:10),
            _EdgeRow(
              label:'Node',
              value:_shortNodeId(identity.nodeId),
            ),
            _EdgeRow(
              label:'Registration',
              value:identity.registrationState.name
                  .replaceAllMapped(
                    RegExp(r'([A-Z])'),
                    (match)=>' ${match.group(1)}',
                  )
                  .replaceAll('_',' '),
            ),
            _EdgeRow(
              label:'Canonical Edge',
              value:snapshot.controlPlane.configured
                  ?(snapshot.controlPlane.canonicallyEnrolled
                      ?'Enrolled · ${snapshot.controlPlane.registrationState.name}'
                      :'Configured · not enrolled')
                  :'Not configured · local only',
            ),
            _EdgeRow(
              label:'Control plane',
              value:snapshot.controlPlane.reachable
                  ?'Verified recently'
                  :snapshot.controlPlane.reason
                      .replaceAll('_',' '),
            ),
            if(snapshot.controlPlane.lastServerSeenAt!=null)
              _EdgeRow(
                label:'Last canonical heartbeat',
                value:snapshot.controlPlane.lastServerSeenAt!
                    .toLocal()
                    .toIso8601String(),
              ),
            _EdgeRow(
              label:'Local AI',
              value:snapshot.localAiAvailable
                  ?'On-device llama.cpp ready'
                  :snapshot.models.isEmpty
                      ?'No verified GGUF installed'
                      :'Model installed · runtime/resources unavailable',
            ),
            _EdgeRow(
              label:'Local embeddings',
              value:snapshot.localEmbeddingsAvailable
                  ?'On-device · zero egress'
                  :'Unavailable · lexical fallback',
            ),
            _EdgeRow(
              label:'Local knowledge',
              value:snapshot.localEmbeddingsAvailable
                  ?'Encrypted · hybrid vector + lexical'
                  :'Encrypted · lexical offline fallback',
            ),
            _EdgeRow(
              label:'Storage',
              value:'$localCopies authorised local roles · not canonical',
            ),
            _EdgeRow(
              label:'Storage Fabric',
              value:snapshot.storageTopologyAvailable
                  ?'${snapshot.storageHealthyEndpointCount} healthy endpoints'
                  : 'Canonical topology not synced',
            ),
            if(snapshot.storageTopologyAvailable)
              _EdgeRow(
                label:'Storage authority',
                value:snapshot.storageTopologyStale
                    ?'Topology stale · no promotion'
                    :snapshot.storageDegradedCanonicalCount>0
                        ?'${snapshot.storageDegradedCanonicalCount} canonical '
                            'stores degraded · recovery only'
                        :'Canonical owners healthy · phone not canonical',
              ),
            _EdgeRow(
              label:'Models',
              value:'${snapshot.models.length} installed · '
                  '$executableModels executable',
            ),
            _EdgeRow(
              label:'Memory',
              value:resources.memory.name,
            ),
            _EdgeRow(
              label:'Storage capacity',
              value:resources.storage.name,
            ),
            _EdgeRow(
              label:'Battery',
              value:resources.battery.name,
            ),
            _EdgeRow(
              label:'Thermal',
              value:resources.thermal.name,
            ),
            _EdgeRow(
              label:'Local network',
              value:resources.localNetworkAvailable
                  ?'Available'
                  :'Unavailable',
            ),
            _EdgeRow(
              label:'Trusted local computers',
              value:'${snapshot.trustedLocalBridgeCount}',
            ),
            _EdgeRow(
              label:'Private AI route',
              value:_routeLabel(
                snapshot.privateIntelligenceRoute.selected.name,
              ),
            ),
            _EdgeRow(
              label:'Core contract bridge',
              value:titanMerge80MobileIntegrationStatus.compatible
                  ?'Merge80 compatible · company_id'
                  :'Needs attention',
            ),
            if(snapshot.lastExecution!=null)...[
              const Divider(height:24),
              Text(
                snapshot.lastExecution!.userLabel,
                style:Theme.of(context).textTheme.bodyMedium,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _EdgeRow extends StatelessWidget {
  final String label;
  final String value;
  const _EdgeRow({required this.label,required this.value});

  @override
  Widget build(BuildContext context)=>Padding(
    padding:const EdgeInsets.symmetric(vertical:3),
    child:Row(
      crossAxisAlignment:CrossAxisAlignment.start,
      children:[
        Expanded(child:Text(label)),
        const SizedBox(width:12),
        Flexible(
          child:Text(
            value,
            textAlign:TextAlign.end,
          ),
        ),
      ],
    ),
  );
}

class _LocalBridgeDiscoveryCard extends StatelessWidget {
  final List<TitanLocalBridgeDiscoveryCandidate> candidates;
  final bool discovering;
  final Object? error;
  final String pairingMessage;
  final VoidCallback onDiscover;
  final VoidCallback? onPair;

  const _LocalBridgeDiscoveryCard({
    required this.candidates,
    required this.discovering,
    required this.error,
    required this.pairingMessage,
    required this.onDiscover,
    required this.onPair,
  });

  @override
  Widget build(BuildContext context)=>Card(
    child:Padding(
      padding:const EdgeInsets.all(16),
      child:Column(
        crossAxisAlignment:CrossAxisAlignment.start,
        children:[
          Row(
            children:[
              const Icon(Icons.computer_outlined),
              const SizedBox(width:8),
              Expanded(
                child:Text(
                  'Private computers',
                  style:Theme.of(context).textTheme.titleMedium,
                ),
              ),
              if(onPair!=null)
                TextButton.icon(
                  onPressed:onPair,
                  icon:const Icon(Icons.link_outlined),
                  label:const Text('Pair'),
                ),
              TextButton.icon(
                onPressed:discovering?null:onDiscover,
                icon:discovering
                    ?const SizedBox(
                        width:16,
                        height:16,
                        child:CircularProgressIndicator(strokeWidth:2),
                      )
                    :const Icon(Icons.radar_outlined),
                label:Text(discovering?'Scanning':'Scan'),
              ),
            ],
          ),
          const SizedBox(height:6),
          const Text(
            'Local-network discovery is untrusted. A computer is not '
            'trusted or authorised until you confirm its pairing QR/code '
            'and Titan pins its HTTPS identity.',
          ),
          if(error!=null)...[
            const SizedBox(height:8),
            Text(
              'Discovery unavailable: $error',
              style:Theme.of(context).textTheme.bodySmall,
            ),
          ],
          if(pairingMessage.isNotEmpty)...[
            const SizedBox(height:8),
            Text(
              pairingMessage,
              style:Theme.of(context).textTheme.bodySmall,
            ),
          ],
          if(candidates.isNotEmpty)...[
            const Divider(height:22),
            ...candidates.take(8).map(
              (candidate)=>ListTile(
                contentPadding:EdgeInsets.zero,
                dense:true,
                leading:const Icon(Icons.laptop_outlined),
                title:Text(candidate.displayName),
                subtitle:Text(
                  '${candidate.endpoint.host}:'
                  '${candidate.endpoint.hasPort?candidate.endpoint.port:443}'
                  ' · pairing required',
                ),
                trailing:const Icon(Icons.lock_outline),
              ),
            ),
          ],
        ],
      ),
    ),
  );
}

class _MetricCard extends StatelessWidget {
  final String title;
  final Map<String,String> rows;
  const _MetricCard({required this.title,required this.rows});

  @override
  Widget build(BuildContext context)=>Card(
    child:Padding(
      padding:const EdgeInsets.all(16),
      child:Column(
        crossAxisAlignment:CrossAxisAlignment.start,
        children:[
          Text(title,style:Theme.of(context).textTheme.titleMedium),
          const SizedBox(height:8),
          ...rows.entries.map(
            (entry)=>Padding(
              padding:const EdgeInsets.symmetric(vertical:4),
              child:Row(
                children:[
                  Expanded(child:Text(entry.key)),
                  const SizedBox(width:12),
                  Flexible(
                    child:Text(
                      entry.value,
                      textAlign:TextAlign.end,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class _ErrorState extends StatelessWidget {
  final Object error;
  final VoidCallback onRetry;
  const _ErrorState({required this.error,required this.onRetry});

  @override
  Widget build(BuildContext context)=>Center(
    child:Padding(
      padding:const EdgeInsets.all(24),
      child:Column(
        mainAxisSize:MainAxisSize.min,
        children:[
          const Icon(Icons.cloud_off_outlined,size:42),
          const SizedBox(height:12),
          const Text(
            'System status is temporarily unavailable.',
            textAlign:TextAlign.center,
          ),
          const SizedBox(height:8),
          Text(
            '$error',
            textAlign:TextAlign.center,
            style:Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height:16),
          FilledButton(
            onPressed:onRetry,
            child:const Text('Retry'),
          ),
        ],
      ),
    ),
  );
}
