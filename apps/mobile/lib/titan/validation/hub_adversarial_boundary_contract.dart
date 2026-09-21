import '../models/hub_commercial_workforce_intent.dart';
import '../models/hub_customer_workforce_intent.dart';

class HubAdversarialBoundaryContract {
  static const _internalKeys=<String>{
    'provider_key','api_key','storage_topology','risk_score','internal_notes',
    'workforce_hierarchy','authority_token','capability_token','device_secret',
  };

  static void validateProjection({
    required String expectedCompanyId,
    required String expectedCustomerId,
    required Map<String,dynamic> payload,
  }){
    if(expectedCompanyId.trim().isEmpty||expectedCustomerId.trim().isEmpty){
      throw StateError('Expected Hub company/customer scope is required');
    }
    if(payload['company_id']!=expectedCompanyId||
       payload['customer_id']!=expectedCustomerId){
      throw StateError('Cross-company/customer Hub projection rejected');
    }
    if(payload.keys.any(_internalKeys.contains)){
      throw StateError('Internal topology, secrets or control metadata leaked to Hub');
    }
    if(payload['surface']!=null&&payload['surface']!='hub'){
      throw StateError('Non-Hub projection rejected');
    }
  }

  static void validateOfflineCommand(Map<String,dynamic> context){
    if(context['surface']!='hub')throw StateError('Offline Hub command surface mismatch');
    if(context['authority_granted']!=false){
      throw StateError('Offline state cannot elevate Hub authority');
    }
    if(context['requires_command_bus']!=true||
       context['requires_server_revalidation']!=true){
      throw StateError('Offline consequential intent must re-enter governed execution');
    }
  }

  static void validateCustomerIntent(HubCustomerWorkforceIntent intent){
    final context=intent.toCommandContext();
    if(context['authority_granted']!=false||
       context['requires_command_bus']!=true){
      throw StateError('Customer workforce intent grants authority');
    }
  }

  static void validateCommercialIntent(HubCommercialWorkforceIntent intent){
    validateOfflineCommand(intent.toCommandContext());
  }
}
