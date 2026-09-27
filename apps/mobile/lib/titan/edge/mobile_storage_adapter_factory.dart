import '../services/titan_http_client.dart';
import 'delegated_storage_provider_adapter.dart';
import 'device_encrypted_storage_adapter.dart';
import 'storage_adapter_registry.dart';
import 'storage_fabric_topology.dart';
import 'storage_transfer_ticket.dart';
import 'storage_provider_adapter.dart';

class TitanMobileStorageAdapterFactory {
  const TitanMobileStorageAdapterFactory();

  TitanStorageAdapterRegistry build({
    required String scopeKey,
    required TitanStorageTransferTicketProvider ticketProvider,
    required TitanHttpClient httpClient,
  }){
    final adapters=<TitanStorageProviderAdapter>[
      TitanDeviceEncryptedStorageAdapter(
        scopeKey:scopeKey,
        provider:TitanStorageProviderKind.deviceEncrypted,
      ),
      TitanDeviceEncryptedStorageAdapter(
        scopeKey:scopeKey,
        provider:TitanStorageProviderKind.localFilesystem,
      ),
      for(final provider in const [
        TitanStorageProviderKind.nas,
        TitanStorageProviderKind.s3,
        TitanStorageProviderKind.s3Compatible,
        TitanStorageProviderKind.minio,
        TitanStorageProviderKind.googleDrive,
        TitanStorageProviderKind.dropbox,
        TitanStorageProviderKind.oneDrive,
        TitanStorageProviderKind.sharePoint,
        TitanStorageProviderKind.customerVps,
      ])
        TitanDelegatedStorageProviderAdapter(
          provider:provider,
          tickets:ticketProvider,
          httpClient:httpClient,
        ),
    ];
    return TitanStorageAdapterRegistry(adapters);
  }
}
