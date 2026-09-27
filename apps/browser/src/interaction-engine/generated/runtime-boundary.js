"use strict";
/**
 * Titan Code embedded Interaction Engine browser-runtime boundary.
 *
 * Pass 2 deliberately exposes only a frozen runtime descriptor. Domain
 * contracts, LocalBrain, journeys, wizards and persistence are introduced by
 * later passes. This file must remain browser-safe and free of Node-only APIs.
 */
function installTitanInteractionEngineRuntimeBoundary() {
    const runtimeAuthority = Object.freeze({
        plan_advance: false,
        plan_complete: false,
        canonical_promote: false,
        merge: false,
        verification: false,
        repository_write: false,
        shell: false,
        database_mutation: false
    });
    const runtimeDescriptor = Object.freeze({
        schema: "titan-code-interaction-runtime-boundary/v1",
        version: 1,
        runtime: "embedded_browser",
        offline_core: true,
        provider_optional: true,
        company_scope: "company_id",
        authority: runtimeAuthority
    });
    const interactionGlobal = globalThis;
    const existingRuntime = interactionGlobal.TitanInteractionEngineRuntime;
    if (existingRuntime && existingRuntime.schema !== runtimeDescriptor.schema) {
        throw new Error("ERR_INTERACTION_RUNTIME_BOUNDARY_CONFLICT");
    }
    interactionGlobal.TitanInteractionEngineRuntime = existingRuntime ?? runtimeDescriptor;
}
installTitanInteractionEngineRuntimeBoundary();
