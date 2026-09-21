import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile/titan/models/mobile_surface_projection.dart';
import 'package:titan_mobile/titan/services/hub_customer_workforce_projection_service.dart';
import 'package:titan_mobile/titan/validation/hub_customer_workforce_projection_contract.dart';

void main(){
  const service=HubCustomerWorkforceProjectionService();

  test('Hub projects exactly three canonical customer-safe workforce identities',(){
    final team=service.homeTeam(
      companyId:'company-1',
      actorId:'customer-1',
      projection:TitanMobileProjection.hub,
    );
    expect(team.length,3);
    expect(team.every((x)=>x.agentId.startsWith('TZAG-')),isTrue);
    HubCustomerWorkforceProjectionContract.validate(team);
  });

  test('Hub projection fails closed on non-Hub surface',(){
    expect(
      ()=>service.homeTeam(
        companyId:'company-1',
        actorId:'customer-1',
        projection:TitanMobileProjection.go,
      ),
      throwsStateError,
    );
  });

  test('Hub projection fails closed without company binding',(){
    expect(
      ()=>service.homeTeam(
        companyId:'',
        actorId:'customer-1',
        projection:TitanMobileProjection.hub,
      ),
      throwsStateError,
    );
  });
}
