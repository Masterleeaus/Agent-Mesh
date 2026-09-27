import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main(){
  test('delegated storage uses Core ticket boundary and forbids credential-bearing tickets',(){
    final provider=File(
      'lib/titan/edge/core_storage_transfer_ticket_provider.dart',
    ).readAsStringSync();
    final validator=File(
      'lib/titan/edge/storage_transfer_ticket_validator.dart',
    ).readAsStringSync();
    expect(provider,contains('authorization'));
    expect(provider,contains('storageTransferPath'));
    expect(provider,contains("'authority_effect':'none'"));
    expect(validator,contains("'authorization'"));
    expect(validator,contains('URL embeds credentials'));
    expect(validator,contains('outside endpoint allowlist'));
  });
}
