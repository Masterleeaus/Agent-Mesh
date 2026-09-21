import '../models/hub_commercial_workforce_intent.dart';
import '../models/hub_customer_request.dart';
import '../models/hub_payment_checkout_request.dart';

class HubCommercialWorkforceRouter {
  const HubCommercialWorkforceRouter();
  static const revenueAgentId='TZAG-REV-MISSED-REVENUE-RECOVERY';

  HubCommercialWorkforceIntent quote({
    required String companyId,
    required TitanHubCustomerRequest request,
  }){
    _scope(companyId,request.customerId);
    if(!const {'quote_accept','quote_decline','quote_change','add_on_request'}
        .contains(request.type)){
      throw StateError('Unsupported Hub quote/add-on intent');
    }
    final details=request.details;
    final quoteId=(details['quote_id']??details['quoteId']??request.requestId).toString();
    final revisionRaw=details['quote_revision']??details['quoteRevision'];
    return HubCommercialWorkforceIntent(
      companyId:companyId,customerId:request.customerId,agentId:revenueAgentId,
      capability:'quote.manage',intentType:request.type,resourceId:quoteId,
      resourceRevision:revisionRaw is int?revisionRaw:null,requestId:request.requestId,
    );
  }

  HubCommercialWorkforceIntent payment({
    required String companyId,
    required TitanHubPaymentCheckoutRequest checkout,
  }){
    _scope(companyId,checkout.customerId);
    return HubCommercialWorkforceIntent(
      companyId:companyId,customerId:checkout.customerId,agentId:revenueAgentId,
      capability:'payment.intent.prepare',intentType:'payment_intent',
      resourceId:checkout.invoiceId,requestId:checkout.checkoutRequestId,
    );
  }

  void _scope(String companyId,String customerId){
    if(companyId.trim().isEmpty||customerId.trim().isEmpty){
      throw StateError('Hub commercial intent requires company_id and customer binding');
    }
  }
}
