export * from "./descriptor.js";
export * from "./runtime.js";
export * from "./workforce.js";
export * from "./intelligence.js";
export * from "./business-ops.js";

export * from "./offline/index.js";

export * from "./ported/marketplace-commercial-lifecycle.js";

export * from "./titan-builder/index.js";

export { createTitanConnectorDescriptor, TITAN_CONNECTOR_CONTRACT } from "./ported/titan-connect/connector-contract.js";
export type { ConnectorCapability, ConnectorPermission, ConnectorHealth, TitanConnectorDescriptor } from "./ported/titan-connect/connector-contract.js";

export { negotiateTitanMcpHost, TITAN_MCP_HOST_CONTRACT } from "./ported/titan-connect/mcp-host-contract.js";
export type { TitanMcpHostFeatures, TitanMcpHostNegotiation } from "./ported/titan-connect/mcp-host-contract.js";
