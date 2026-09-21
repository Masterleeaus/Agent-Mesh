import 'local_network_endpoint_policy.dart';
import 'storage_fabric_topology.dart';
import 'storage_transfer_ticket.dart';

class TitanStorageTransferTicketValidator {
  const TitanStorageTransferTicketValidator();

  void validate({
    required TitanStorageTransferTicket ticket,
    required TitanStorageFabricEndpoint endpoint,
    required TitanStorageFabricRole role,
    required String companyId,
    required String dataClass,
    required String objectId,
    required TitanStorageTransferOperation operation,
    required DateTime now,
  }){
    if(ticket.ticketId.trim().isEmpty||
        ticket.companyId!=companyId||
        ticket.endpointId!=endpoint.endpointId||
        ticket.provider!=endpoint.provider||
        ticket.role!=role||
        ticket.operation!=operation||
        ticket.dataClass!=dataClass||
        ticket.objectId!=objectId){
      throw StateError('storage transfer ticket identity mismatch');
    }
    if(!ticket.expiresAt.toUtc().isAfter(now.toUtc())||
        ticket.expiresAt.toUtc().difference(now.toUtc())>
            const Duration(hours:1)){
      throw StateError('storage transfer ticket expiry invalid');
    }
    if(ticket.uri.userInfo.isNotEmpty){
      throw StateError('storage transfer URL embeds credentials');
    }
    if(endpoint.allowedTransferHosts.isNotEmpty&&
        !_hostAllowed(
          ticket.uri.host.toLowerCase(),
          endpoint.allowedTransferHosts,
        )){
      throw StateError(
        'storage transfer URL host is outside endpoint allowlist',
      );
    }
    for(final header in ticket.headers.keys){
      if(const {
        'authorization',
        'proxy-authorization',
        'cookie',
        'set-cookie',
      }.contains(header.toLowerCase())){
        throw StateError(
          'storage transfer ticket contains forbidden credential header',
        );
      }
    }
    if(ticket.maxBytes<=0){
      throw StateError('storage transfer ticket size limit invalid');
    }
    if(ticket.objectRef.trim().isEmpty){
      throw StateError('storage transfer ticket object ref missing');
    }
    if(!RegExp(r'^[a-fA-F0-9]{64}$')
        .hasMatch(ticket.expectedSha256)){
      throw StateError(
        'storage transfer ticket requires exact SHA-256',
      );
    }
    if(ticket.dataEgress=='local_network'){
      const TitanLocalNetworkEndpointPolicy().validate(ticket.uri);
    }else{
      if(ticket.uri.scheme!='https'||ticket.uri.host.isEmpty){
        throw StateError(
          'customer storage transfer must use HTTPS',
        );
      }
      if(!const {
        'customer_cloud',
        'customer_service',
      }.contains(ticket.dataEgress)){
        throw StateError('storage transfer egress class invalid');
      }
    }
  }

  bool _hostAllowed(String host,List<String> allowed){
    for(final raw in allowed){
      final value=raw.toLowerCase().trim();
      if(host==value||host.endsWith('.$value'))return true;
    }
    return false;
  }

}
