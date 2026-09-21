import '../models/generative_item.dart';

class GeneratedUiConvergenceContract {
  static void validateHome(List<TitanGenerativeItem> items,{required String companyId,required String surface}){
    if(items.length>3)throw StateError('mobile home may render at most three generated workforce cards');
    for(final item in items){
      if(item.context['company_id']!=companyId)throw StateError('generated card company_id mismatch');
      if(item.context['surface']!=surface)throw StateError('generated card surface mismatch');
      if(item.context['generated_ui_authority_neutral']!=true)throw StateError('generated UI must be authority neutral');
      if(item.context['business_mutation_requires_command_bus']!=true)throw StateError('generated UI mutation must route through Command Bus');
      final workforce=item.workforce;
      if(workforce!=null&&workforce.agentId.trim().isEmpty)throw StateError('canonical workforce agent_id required');
    }
  }
}
