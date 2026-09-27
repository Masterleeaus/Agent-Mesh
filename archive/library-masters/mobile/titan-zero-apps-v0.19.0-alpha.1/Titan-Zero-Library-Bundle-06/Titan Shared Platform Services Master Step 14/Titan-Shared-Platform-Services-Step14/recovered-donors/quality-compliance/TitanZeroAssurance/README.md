# TitanZeroAssurance

Pass 1 canonical kernel for Titan Zero quality, compliance and assurance.

## Core rule

`company_id` is the sole tenant/company boundary. Web requests may resolve it from the authenticated user's `company_id`, but jobs, queues, schedules and AI/Workforce actions should set an explicit `CompanyExecutionContext` in `ExecutionContextStore` before touching company-scoped domain data.

## Risk default

- low: execution may proceed when all required capabilities are granted;
- medium/high/critical: approval required;
- missing required capability: blocked.

The module intentionally provides contracts and governance primitives only. Domain convergence is performed in later passes.
