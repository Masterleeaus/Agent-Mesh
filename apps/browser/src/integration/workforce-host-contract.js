(function(g){'use strict';
const REQUIRED=['registerManager','registerPrompts','registerSkills','registerProfiles','registerContextProvider','registerDiagnosticsSection','registerSettingsSection'];
const OPTIONAL=['registerWorkspacePage','requestRepositoryCapability','requestMcpCapability','requestProviderAssistance','requestPlanDraft','requestGovernedMutation'];
function inspect(host){return {required:Object.fromEntries(REQUIRED.map(k=>[k,typeof host?.[k]==='function'])),optional:Object.fromEntries(OPTIONAL.map(k=>[k,typeof host?.[k]==='function']))};}
const hostContract=Object.freeze({REQUIRED,OPTIONAL,inspect});g.TitanBrowserNodeWorkforceHostContract=hostContract;g.CodeeWorkforceHostContract=hostContract;})(globalThis);
