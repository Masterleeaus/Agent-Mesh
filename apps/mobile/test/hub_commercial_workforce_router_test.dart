import 'package:flutter_test/flutter_test.dart';
import 'package:titan_mobile/titan/models/hub_customer_request.dart';
import 'package:titan_mobile/titan/models/hub_payment_checkout_request.dart';
import 'package:titan_mobile/titan/services/hub_commercial_workforce_router.dart';
import 'package:titan_mobile/titan/validation/hub_commercial_workforce_contract.dart';

void main(){
  const router=HubCommercialWorkforceRouter();

  test('quote approval reuses canonical revenue agent and revision',(){
    final request=TitanHubCustomerRequest(
      requestId:'decision-1',type:'quote_accept',customerId:'customer-1',
      summary:'Accept quote',requestedOutcome:'Accept after revalidation',
      createdAt:DateTime.utc(2026,9,20),
      details:{'quote_id':'quote-1','quote_revision':3},
    );
    final intent=router.quote(companyId:'company-1',request:request);
    expect(intent.agentId,'TZAG-REV-MISSED-REVENUE-RECOVERY');
    expect(intent.resourceRevision,3);
    HubCommercialWorkforceContract.validate(intent);
  });

  test('payment creates intent only and requires server revalidation',(){
    final checkout=TitanHubPaymentCheckoutRequest(
      checkoutRequestId:'checkout-1',customerId:'customer-1',
      invoiceId:'invoice-1',amount:170,offeredSaving:10,
      createdAt:DateTime.utc(2026,9,20),
    );
    final intent=router.payment(companyId:'company-1',checkout:checkout);
    final ctx=intent.toCommandContext();
    expect(intent.capability,'payment.intent.prepare');
    expect(ctx['authority_granted'],false);
    expect(ctx['requires_command_bus'],true);
    expect(ctx['requires_server_revalidation'],true);
    HubCommercialWorkforceContract.validate(intent);
  });

  test('unsupported internal commercial operation fails closed',(){
    final request=TitanHubCustomerRequest(
      requestId:'x',type:'write_off_invoice',customerId:'customer-1',
      summary:'x',requestedOutcome:'x',createdAt:DateTime.utc(2026,9,20),
    );
    expect(()=>router.quote(companyId:'company-1',request:request),throwsStateError);
  });
}
