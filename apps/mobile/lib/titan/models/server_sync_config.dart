class TitanServerSyncConfig {
  final Uri baseUri;
  final String replayPath;
  final String healthPath;
  final String evidencePreparePath;
  final String authRefreshPath;
  final String signalPullPath;
  final String projectionReadPath;
  final String entityReadPath;
  final String operationsStatusPath;
  final String storageTransferPath;
  final String storageTopologyPath;
  final bool allowInsecureLocalDevelopment;
  final Duration connectTimeout;
  final Duration requestTimeout;
  final int maxEvidenceBytes;

  const TitanServerSyncConfig({
    required this.baseUri,
    this.replayPath='/v1/mobile/replay',
    this.healthPath='/v1/mobile/health',
    this.evidencePreparePath='/v1/mobile/evidence/uploads',
    this.authRefreshPath='/v1/mobile/auth/refresh',
    this.signalPullPath='/v1/mobile/signals',
    this.projectionReadPath='/v1/mobile/projections',
    this.entityReadPath='/v1/mobile/entities',
    this.operationsStatusPath='/v1/mobile/operations/status',
    this.storageTransferPath='/v1/mobile/storage/transfers',
    this.storageTopologyPath='/v1/mobile/storage/topology',
    this.allowInsecureLocalDevelopment=false,
    this.connectTimeout=const Duration(seconds:10),
    this.requestTimeout=const Duration(seconds:30),
    this.maxEvidenceBytes=25*1024*1024,
  });

  Uri resolve(String path)=>baseUri.resolve(path);

  void validate(){
    if(!baseUri.hasScheme||baseUri.host.isEmpty){
      throw StateError('Titan server sync base URL is invalid');
    }
    if(baseUri.userInfo.isNotEmpty){
      throw StateError(
        'Titan server sync base URL cannot contain embedded credentials',
      );
    }
    if(maxEvidenceBytes<=0){
      throw StateError('Titan evidence size limit must be positive');
    }
    final scheme=baseUri.scheme.toLowerCase();
    if(scheme=='https')return;
    final host=baseUri.host.toLowerCase();
    final local=host=='localhost'||
        host=='127.0.0.1'||
        host=='::1';
    if(scheme=='http'&&
        local&&
        allowInsecureLocalDevelopment){
      return;
    }
    throw StateError(
      'Titan server sync requires HTTPS outside explicit local development',
    );
  }
}
