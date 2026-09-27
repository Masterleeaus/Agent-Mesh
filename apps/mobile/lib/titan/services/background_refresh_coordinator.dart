import '../models/mobile_lifecycle_envelope.dart';
import 'mobile_lifecycle_router.dart';

class TitanBackgroundRefreshCoordinator {
  static const bool allowsConsequentialExecution=false;
  final TitanMobileLifecycleRouter router;
  const TitanBackgroundRefreshCoordinator(this.router);

  TitanLifecycleResumePlan prepare(TitanMobileLifecycleEnvelope envelope){
    if(envelope.kind!='background_refresh') throw StateError('background refresh envelope required');
    // Background execution may refresh projections/sync state only. It never
    // converts a transport wake-up into permission to mutate the business.
    final plan=router.resolve(envelope);
    if(!plan.requiresServerAuthorityRecheck){
      throw StateError('background refresh cannot bypass authority recheck');
    }
    return plan;
  }
}
