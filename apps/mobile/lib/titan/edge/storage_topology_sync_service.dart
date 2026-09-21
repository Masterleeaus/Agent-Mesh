import 'dart:convert';
import '../models/server_sync_config.dart';
import '../services/auth_retry_helper.dart';
import '../services/titan_auth_token_provider.dart';
import '../services/titan_http_client.dart';
import '../services/titan_mobile_contract_headers.dart';
import '../services/titan_server_sync_exceptions.dart';
import 'storage_fabric_topology.dart';
import 'storage_fabric_topology_repository.dart';

class TitanStorageTopologySyncResult {
  final bool updated;
  final bool unchanged;
  final TitanStorageFabricTopology? topology;

  const TitanStorageTopologySyncResult({
    required this.updated,
    required this.unchanged,
    required this.topology,
  });
}

class TitanStorageTopologySyncService {
  final String companyId;
  final String actorId;
  final String deviceId;
  final String surface;
  final TitanServerSyncConfig config;
  final TitanAuthTokenProvider authTokenProvider;
  final TitanHttpClient httpClient;
  final TitanStorageFabricTopologyRepository repository;
  final TitanAuthRetryHelper authRetryHelper;

  const TitanStorageTopologySyncService({
    required this.companyId,
    required this.actorId,
    required this.deviceId,
    required this.surface,
    required this.config,
    required this.authTokenProvider,
    required this.httpClient,
    required this.repository,
    this.authRetryHelper=const TitanAuthRetryHelper(),
  });

  Future<TitanStorageTopologySyncResult> synchronize() async{
    config.validate();
    var token=await authRetryHelper.token(authTokenProvider);
    if(token==null||token.isEmpty){
      throw const TitanAuthenticationRequiredException();
    }
    final current=await repository.load();
    var response=await _get(token,current?.sequence??0);
    if(response.statusCode==401||response.statusCode==403){
      token=await authRetryHelper.refreshAfterUnauthorized(
        authTokenProvider,
      );
      if(token==null||token.isEmpty){
        throw const TitanAuthenticationRequiredException();
      }
      response=await _get(token,current?.sequence??0);
    }
    if(response.statusCode==401||response.statusCode==403){
      throw const TitanAuthenticationRequiredException();
    }
    if(response.statusCode==426){
      throw const TitanClientContractUpgradeException();
    }
    if(response.statusCode==204||response.statusCode==304){
      return TitanStorageTopologySyncResult(
        updated:false,
        unchanged:true,
        topology:current,
      );
    }
    if(response.statusCode<200||response.statusCode>=300){
      throw StateError(
        'storage topology sync returned HTTP ${response.statusCode}',
      );
    }
    final decoded=jsonDecode(response.body);
    if(decoded is! Map){
      throw StateError('storage topology response is invalid');
    }
    final topology=TitanStorageFabricTopology.fromJson(
      Map<String,dynamic>.from(decoded),
    );
    await repository.apply(topology);
    return TitanStorageTopologySyncResult(
      updated:true,
      unchanged:false,
      topology:topology,
    );
  }

  Future<dynamic> _get(String token,int sequence){
    final base=config.resolve(config.storageTopologyPath);
    final uri=base.replace(queryParameters:{
      ...base.queryParameters,
      'known_sequence':'$sequence',
      'surface':surface,
    });
    return httpClient.get(
      uri,
      headers:{
        'authorization':'Bearer $token',
        'accept':'application/json',
        ...TitanMobileContractHeaders.scoped(
          companyId:companyId,
          actorId:actorId,
          deviceId:deviceId,
          surface:surface,
        ),
      },
      timeout:config.requestTimeout,
    );
  }
}
