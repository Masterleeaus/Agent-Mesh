import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main(){
  test('mobile adapter factory includes customer object/document stores but no direct DB adapters',(){
    final source=File(
      'lib/titan/edge/mobile_storage_adapter_factory.dart',
    ).readAsStringSync();
    for(final provider in [
      'nas',
      's3',
      's3Compatible',
      'minio',
      'googleDrive',
      'dropbox',
      'oneDrive',
      'sharePoint',
      'customerVps',
    ]){
      expect(source,contains('TitanStorageProviderKind.$provider'));
    }
    expect(source,isNot(contains('TitanStorageProviderKind.postgres')));
    expect(source,isNot(contains('TitanStorageProviderKind.mysql')));
    expect(source,isNot(contains('TitanStorageProviderKind.awsRds')));
  });
}
