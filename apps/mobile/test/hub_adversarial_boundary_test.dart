import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile/titan/validation/hub_adversarial_boundary_contract.dart';

void main(){
  test('rejects cross-company customer projection',(){
    expect(()=>HubAdversarialBoundaryContract.validateProjection(
      expectedCompanyId:'company-a',expectedCustomerId:'customer-a',
      payload:{'company_id':'company-b','customer_id':'customer-a','surface':'hub'},
    ),throwsStateError);
  });

  test('rejects internal topology and secrets',(){
    for(final key in ['provider_key','storage_topology','risk_score',
      'workforce_hierarchy','authority_token','device_secret']){
      expect(()=>HubAdversarialBoundaryContract.validateProjection(
        expectedCompanyId:'company-a',expectedCustomerId:'customer-a',
        payload:{'company_id':'company-a','customer_id':'customer-a',
          'surface':'hub',key:'forbidden'},
      ),throwsStateError);
    }
  });

  test('offline cannot elevate authority or bypass revalidation',(){
    expect(()=>HubAdversarialBoundaryContract.validateOfflineCommand({
      'surface':'hub','authority_granted':true,
      'requires_command_bus':true,'requires_server_revalidation':true,
    }),throwsStateError);
    expect(()=>HubAdversarialBoundaryContract.validateOfflineCommand({
      'surface':'hub','authority_granted':false,
      'requires_command_bus':true,'requires_server_revalidation':false,
    }),throwsStateError);
  });

  test('safe customer projection passes',(){
    HubAdversarialBoundaryContract.validateProjection(
      expectedCompanyId:'company-a',expectedCustomerId:'customer-a',
      payload:{'company_id':'company-a','customer_id':'customer-a',
        'surface':'hub','service_status':'confirmed'},
    );
  });
}
