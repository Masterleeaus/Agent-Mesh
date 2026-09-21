# Infrastructure Options — Field Crew AI

## Current Setup

The site runs as a pnpm monorepo on Replit:
- `artifacts/field-crew-ai` — React + Vite frontend (the marketing site)
- `artifacts/api-server` — Express API server (currently has no wired endpoints)
- Both served through Replit's shared reverse proxy

**Published URL** (when deployed on Replit): a `.replit.app` subdomain, or your custom domain `fieldcrewai.com` if configured.

---

## Option A: Keep Running on Replit

**Recommended for:** Early stage, while the backend is minimal and you are still iterating on the site.

### What Replit handles automatically
- SSL certificate provisioning and renewal
- CDN and global distribution
- Zero-downtime deploys (push code → redeploy → live)
- Custom domain mapping (one setting in the Replit Deployments panel)
- Environment variable / secrets management
- No server maintenance, patching, or ops work

### What you pay
- Replit deployment pricing — check current plans at replit.com/pricing
- Roughly comparable to a $20-50/month VPS, but with zero ops overhead

### Limitations
- Less control over the server environment
- Dependent on Replit's infrastructure (uptime, pricing, platform decisions)
- Cold start latency on the API server if it spins down (not an issue on paid plans)
- The monorepo structure is Replit-opinionated — migrating later requires restructuring

### When to stay on Replit
- You are still actively developing the site
- The backend is simple (contact form, lead magnet, no database yet)
- You do not have a DevOps person or want to spend time on infrastructure

---

## Option B: Self-Host (Recommended Eventually)

**Recommended for:** When the backend needs to hit your own database, CRM integrations are live, or you want full control.

### Stack recommendation for self-hosting

**Frontend (static):**
- Build the Vite frontend: `pnpm --filter @workspace/field-crew-ai run build`
- Output: `artifacts/field-crew-ai/dist/`
- Host on: **Cloudflare Pages** (free) or **Vercel** (free tier)
- Automatic SSL, CDN, deploy on push from GitHub

**Backend (API server):**
- Host on: **Railway** ($5/month), **Render** (free tier + paid), or a **DigitalOcean Droplet** ($6/month)
- The API server is Express — any Node.js host works
- Set environment variables in the host's dashboard

**Database (when needed):**
- **Neon** (PostgreSQL, free tier, serverless) — already used by this Replit environment
- Or: **PlanetScale** (MySQL), **Supabase** (Postgres + auth + storage)

**Domain:**
- DNS managed by Cloudflare (free)
- Point `fieldcrewai.com` to Cloudflare Pages for the frontend
- Point `api.fieldcrewai.com` to Railway/Render for the backend

### What changes in the code when migrating
1. Update `BASE_PATH` config — the frontend currently uses Replit's path-based routing
2. Update API URL — the frontend calls `/api/...` which works on Replit because the proxy routes it. On self-hosted, update to `https://api.fieldcrewai.com/...`
3. Set environment variables on the new host
4. Wire the contact form and lead magnet endpoints

### Estimated monthly cost when self-hosted
| Service | Cost |
|---|---|
| Cloudflare Pages (frontend) | Free |
| Railway (API server) | $5-10/month |
| Neon (database) | Free up to ~100k queries/day |
| Cloudflare (DNS + proxy) | Free |
| **Total** | **~$5-10/month** |

---

## Option C: Hybrid (Most Practical Near-Term)

**Frontend:** Move to Cloudflare Pages (free, fast, zero ops)
**Backend:** Keep on Replit or move to Railway when endpoints are needed
**Database:** Neon (already provisioned in this Replit environment)

This lets you move the static site off Replit immediately (reducing dependency) while keeping the API development on Replit until you are ready to wire real endpoints.

---

## Migration Steps (When Ready)

1. Run `pnpm --filter @workspace/field-crew-ai run build` — output goes to `dist/`
2. Push the `dist/` folder to a GitHub repo
3. Connect that repo to Cloudflare Pages — configure custom domain
4. Confirm all pages load correctly (the Vite build is a static SPA)
5. Set up the API server on Railway or Render — set environment variables
6. Update the API base URL in the frontend (one constant)
7. Update DNS: `fieldcrewai.com` → Cloudflare Pages, `api.fieldcrewai.com` → API host
8. Verify contact form, lead magnet, Calendly embed all work
9. Submit updated sitemap to Google Search Console

---

## Recommendation

**Right now:** Stay on Replit. The site is a static marketing page with no live backend. Replit's deployment is one click and handles everything. The cost is reasonable for zero ops overhead.

**In 3-6 months:** If you are driving real traffic and the lead magnet is generating captures, move the frontend to Cloudflare Pages (free) and the API to Railway (~$5/month). Total infrastructure cost drops, and you own the stack.

**Do not:** Build a complex self-hosted stack before you have validated that the site is working and converting. Fix the backend endpoints (contact form, lead magnet) first — those matter more than where the site is hosted.
