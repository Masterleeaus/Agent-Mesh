# ResQAI — Troubleshooting

## Authentication Issues

### Localhost OAuth Redirect Loop

**Symptom:** Running `npm run dev` redirects to Lemma OAuth page instead of loading the app.

**Cause:** The Lemma SDK's `AuthGuard` attempts cookie-based auth. On localhost, no Lemma session cookie exists, so the app redirects to the auth service. The dev script should inject a CLI token to bypass this.

**Fix:** Use `npx tsx scripts/dev.ts <app-name>` to start the dev server. This seeds `VITE_LEMMA_TOKEN` from your `.env` file into the Vite process.

```bash
# Get a Lemma CLI token and save it to .env
lemma token | clip
# Edit .env and paste the token as VITE_LEMMA_TOKEN=lemma_...
# Then start the app:
npx tsx scripts/dev.ts support-queue
```

### Cloud OAuth Redirect Not Working

**Symptom:** In production/staging, the OAuth redirect does not complete — the user is stuck in a redirect loop or sees an error.

**Status:** **Resolved.** The app now passes `app_id` and `client_id` as query parameters during the OAuth redirect via the `ProtectedApp` wrapper in `packages/sdk/ProtectedApp.tsx`. The Lemma auth service requires these parameters to identify the OAuth client and redirect back to the correct app URL after authentication.

**Setup:**
1. Set `VITE_LEMMA_APP_ID` and `VITE_LEMMA_CLIENT_ID` in your `.env` file (get these from the Lemma platform console → app settings → OAuth)
2. Ensure the redirect URI registered in the Lemma platform matches your app's URL

### Blank Screen After Login

**Symptom:** SDK loads, user authenticates, but the screen remains blank.

**Checklist:**
1. Open browser DevTools Console — is there an error from `lemma-client.js`?
2. Verify `VITE_LEMMA_POD_ID` is correct in `.env`
3. Verify the Lemma pod exists and is accessible
4. Check that `shared/sdk/lemma-sdk.ts` is importing from `'../types'` (not `'./types'`)

## Build Issues

### TypeScript Compilation Errors

```bash
npm run validate
```

If validation fails:
1. Check for import path mismatches
2. Ensure all apps use `'../../../shared/...'` import patterns
3. Verify `shared/sdk/lemma-sdk.ts` has correct import paths

### Vite Build Fails

```bash
npm run build
```

If a specific app fails:
1. Check `apps/<name>/vite.config.ts` for correct configuration
2. Verify `apps/<name>/tsconfig.json` paths
3. Run `npm run clean` and try again

## Testing Issues

### No Tests Found

Only `support-queue` has unit tests (9 tests via vitest). The other 4 apps have no test coverage. Python functions have pytest test suites.

### Python Tests Fail

```bash
cd functions/account-health-scan
pytest tests/
```

Ensure test dependencies are installed:
```bash
pip install pytest pydantic
```

## Application-Specific Issues

### Support Queue

- **Ticket not updating after action:** Check that the state machine transition is valid (see `apps/support-queue/ARCHITECTURE.md`)
- **Agent returns no result:** The `waitForAgentResponse` has a 135-second timeout — agent may still be processing
- **Classification not working:** Verify `request-classifier` agent is properly configured in the Lemma pod

### CRM Tracker

- **Health scan returns no data:** Ensure `account_health_scan` and `flag_slipping_followups` functions are deployed and accessible
- **Account list not filtering:** Check that health status values match the ENUM (`healthy`, `watch`, `slipping`, `critical`)

### Ops Dashboard

- **Coordinator recommendations not appearing:** Verify `operations-coordinator` agent returns valid JSON with `recommendations[]` array
- **KPI values incorrect:** Data is fetched live from the Lemma pod — verify table records

### Appointment Board

- **Technician suggestion not working:** Verify `operations-coordinator` agent is accessible
- **Appointment status not updating:** Check the status transition is valid

### Resolution Center

- **AI analysis fails:** Verify `resolution-advisor` agent is accessible
- **Evidence panel empty:** The dispute must have `customer_claim`, `provider_claim`, and `evidence_summary` populated

## Known Limitations

1. **Authentication** — Cloud OAuth redirect bug resolved (see "Cloud OAuth Redirect Not Working" above). Ensure `VITE_LEMMA_APP_ID` and `VITE_LEMMA_CLIENT_ID` are set in `.env`.
2. **Testing coverage** — Only 1 of 5 apps has unit tests
3. **CI/CD** — No automated pipeline
4. **Code quality tools** — No ESLint or Prettier configuration
5. **Shared utilities** — `shared/utils/` functions are not imported by any app (dead code)
6. **workflows** — `workflows/` directory is empty; two workflow concepts exist only in agent prompts
7. **Deployment** — No Docker or deployment configuration
