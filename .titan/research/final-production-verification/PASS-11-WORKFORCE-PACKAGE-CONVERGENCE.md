# Pass 11 — Workforce package convergence

## Result

Agent 4 removed a real workspace composition ambiguity that blocked clean Zero → workforce wiring.

### Before

Both of these packages declared the same package name:

- `services/workforce` → `@titan-zero/workforce`
- `packages/workforce` → `@titan-zero/workforce`

That caused `pnpm --filter @titan-zero/workforce ...` to select two implementations and made it unsafe for the web app to depend on a single canonical workforce package.

### Change

- `services/workforce` remains the canonical `@titan-zero/workforce` package.
- `packages/workforce` is retained intact but is explicitly named `@titan-zero/workforce-legacy`.
- The canonical service package now exports its root contract plus `./runtime-adapter` and `./sqlite-store`.
- The canonical service package declares its existing `@titan-zero/storage` dependency.

No workforce engine, store, authority path or runtime was duplicated.

## Verification

Agent 3 Workforce Verification run `36308780181`:

- `pnpm install --no-frozen-lockfile` — PASS
- `pnpm --filter @titan-zero/workforce typecheck` — PASS
- `pnpm --filter @titan-zero/workforce test` — PASS

The filter now resolves the canonical service workforce rather than executing two packages with the same identity.

The existing frozen-lockfile problem remains a separate release gate; this pass intentionally did not hand-edit `pnpm-lock.yaml`.

## Front-door impact

The web app can now add a normal workspace dependency on the canonical `@titan-zero/workforce` package without ambiguous resolution. This removes one blocker for the remaining production seam:

`authenticated Zero message → Interaction Engine → WorkItem(origin) → canonical workforce → persistent runtime → governed outcome → Zero`

## Remaining gate

There is still no existing production Zero/workforce dispatch endpoint. The next pass should add authenticated Zero transport around the existing authority-neutral `createZeroInteraction` contract and canonical workforce/runtime composition, failing closed if the runtime dispatcher is unavailable.
