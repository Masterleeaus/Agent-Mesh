const path=require('path');
function load(){
  const files=[
    'src/lib/capability-registry.js',
    'src/workforce/task-classifier.js','src/workforce/risk-classifier.js','src/workforce/delegation-policy.js','src/workforce/evidence-bundle.js','src/workforce/recommendation-envelope.js','src/workforce/work-order.js','src/workforce/provider-assistance-request.js','src/workforce/handoff-builder.js','src/workforce/tool-request.js','src/workforce/mutation-request.js','src/workforce/verification-request.js','src/workforce/manager-session.js','src/workforce/context-strategy.js','src/workforce/capability-resolver.js','src/workforce/conflict-resolver.js','src/workforce/plan-starter.js','src/workforce/manager-health.js',
    'src/managers/manager-catalog.js','src/managers/manager-registry.js','src/managers/manager-router.js','src/managers/manager-orchestrator.js',
    'src/workforce/workforce-manifest.js','src/catalog/workforce-prompts.js','src/catalog/workforce-skills.js','src/catalog/workforce-profiles.js',
    'src/integration/workforce-host-contract.js','src/integration/workforce-context-bridge.js','src/workforce/manager-workforce-pack.js','src/integration/workforce-receiver-adapter.js','src/lib/workforce-host-integration.js'
  ];
  for(const f of files){ const full=path.resolve(f); delete require.cache[full]; require(full); }
  return globalThis;
}
module.exports={load};
