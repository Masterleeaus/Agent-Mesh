import '../models/hub_customer_request.dart';
import '../models/hub_customer_workforce_intent.dart';
import '../models/hub_service_status_timeline.dart';
import '../models/hub_upcoming_service.dart';
import 'hub_customer_workforce_intent_router.dart';
import 'hub_service_status_service.dart';

class HubCustomerServiceTeamService {
  final HubCustomerWorkforceIntentRouter router;
  final HubServiceStatusService statusService;
  const HubCustomerServiceTeamService({
    this.router=const HubCustomerWorkforceIntentRouter(),
    this.statusService=const HubServiceStatusService(),
  });

  HubCustomerWorkforceIntent prepareRequest({
    required String companyId,
    required TitanHubCustomerRequest request,
  })=>router.route(companyId:companyId,request:request);

  TitanHubServiceStatusTimeline status({
    required TitanHubUpcomingService service,
    List<TitanHubCustomerRequest> requests=const [],
  })=>statusService.build(service,requests:requests);
}
