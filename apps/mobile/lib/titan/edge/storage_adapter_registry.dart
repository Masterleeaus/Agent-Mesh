import 'storage_fabric_topology.dart';
import 'storage_provider_adapter.dart';

class TitanStorageAdapterRegistry {
  final Map<String,TitanStorageProviderAdapter> adapters;

  TitanStorageAdapterRegistry(
    Iterable<TitanStorageProviderAdapter> adapters,
  ):adapters={
     for(final adapter in adapters)
       _key(adapter.provider,adapter.accessMode):adapter,
   };

  TitanStorageProviderAdapter? forEndpoint(
    TitanStorageFabricEndpoint endpoint,
  )=>adapters[_key(endpoint.provider,endpoint.accessMode)];

  static String _key(
    TitanStorageProviderKind provider,
    TitanStorageAccessMode mode,
  )=>'${provider.name}:${mode.name}';
}
