import '../models/hub_customer_workforce_projection.dart';
import '../models/mobile_surface_projection.dart';
import '../models/workforce_context.dart';

class HubCustomerWorkforceProjectionService {
  const HubCustomerWorkforceProjectionService();

  List<HubCustomerWorkforceProjection> homeTeam({
    required String companyId,
    required String actorId,
    required TitanMobileProjection projection,
  }) {
    if(companyId.trim().isEmpty||actorId.trim().isEmpty){
      throw StateError('Hub projection requires company_id and actor binding');
    }
    if(projection.canonicalSurface!='hub'){
      throw StateError('Customer workforce may only project to hub');
    }
    final mapped=<HubCustomerWorkforceProjection>[
      HubCustomerWorkforceProjection.fromCanonical(
        TitanWorkforceContext.customerCare,
        customerCapability:'customer.manage',
      ),
      HubCustomerWorkforceProjection.fromCanonical(
        TitanWorkforceContext.access,
        customerCapability:'booking.manage',
      ),
      HubCustomerWorkforceProjection.fromCanonical(
        TitanWorkforceContext.callbackPrevention,
        customerCapability:'interaction.resolve',
      ),
    ];
    if(mapped.length!=projection.homeCardLimit){
      throw StateError('Hub home must expose exactly three customer-safe staff cards');
    }
    return List.unmodifiable(mapped);
  }
}
