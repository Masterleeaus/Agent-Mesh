# Verification map

| Effect | Required independent observation | Current status |
| --- | --- | --- |
| Schedule/job, worker assignment | Reread company-scoped canonical job/schedule | Unbound |
| Customer update | Reread company-scoped customer | Unbound |
| Email/SMS/push | Provider delivery state plus thread correlation | Unbound |
| MCP mutation | Query resulting resource through mapped read capability | Callback required, not configured |
| Browser mutation | Observe resulting page and business state | Callback required, not configured |

Gateway completion now requires provider `verify(raw, request)` and rejects an acknowledgement alone. The injected verifier must use an independent read; a callback that repeats provider claims is insufficient.
