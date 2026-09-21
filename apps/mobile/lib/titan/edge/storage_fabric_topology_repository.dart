import '../storage/encrypted_json_store.dart';
import 'storage_fabric_topology.dart';
import 'storage_fabric_topology_validator.dart';

class TitanStorageFabricTopologyRepository {
  final String scopeKey;
  final String companyId;
  final TitanEncryptedJsonStore store;
  final TitanStorageFabricTopologyValidator validator;

  TitanStorageFabricTopologyRepository({
    required this.scopeKey,
    required this.companyId,
    TitanEncryptedJsonStore? store,
    this.validator=const TitanStorageFabricTopologyValidator(),
  }):store=store??TitanEncryptedJsonStore();

  String get _key=>'edge.storage.fabric.topology.v1::$scopeKey';

  Future<TitanStorageFabricTopology?> load() async{
    final json=await store.readMap(_key);
    if(json==null)return null;
    final topology=TitanStorageFabricTopology.fromJson(json);
    validator.validate(
      topology:topology,
      companyId:companyId,
      now:DateTime.now().toUtc(),
      enforceFreshness:false,
    );
    return topology;
  }

  Future<void> apply(TitanStorageFabricTopology topology) async{
    validator.validate(
      topology:topology,
      companyId:companyId,
      now:DateTime.now().toUtc(),
    );
    final current=await store.readMap(_key);
    if(current!=null){
      final previous=TitanStorageFabricTopology.fromJson(current);
      if(topology.sequence<previous.sequence){
        throw StateError('storage topology sequence regression');
      }
      if(topology.sequence==previous.sequence){
        if(topology.revision!=previous.revision||
            topology.correlationId!=previous.correlationId){
          throw StateError(
            'storage topology replay has different identity',
          );
        }
        return;
      }
    }
    await store.writeMap(_key,topology.toJson());
  }

  Future<void> clear()=>store.delete(_key);
}
