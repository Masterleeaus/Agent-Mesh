# Titan Zero Merge 74 — Linux VPS bundle

## Fast install (Ubuntu/Debian)

```bash
unzip Titan-Zero-MERGE74-LINUX-VPS.zip
cd Titan-Zero-MERGE74-LINUX-VPS
chmod +x install-vps.sh
./install-vps.sh
```

The installer installs Docker when necessary, creates `.env.vps`, generates database/auth/encryption secrets, builds the web + worker images locally, starts PostgreSQL, and exposes the web app on port `3000` by default.

Open `http://YOUR_SERVER_IP:3000`.

## Before public production use

Edit `.env.vps` and configure your real domain, SMTP, optional AI key and booking account ID. Put a TLS reverse proxy such as Caddy, Nginx or Cloudflare in front of port 3000. Do not expose PostgreSQL publicly.

## Commands

```bash
# status
docker compose --env-file .env.vps -f compose.vps.yml ps

# logs
docker compose --env-file .env.vps -f compose.vps.yml logs -f

# restart
docker compose --env-file .env.vps -f compose.vps.yml restart

# update/rebuild
./update-vps.sh

# database backup
./backup-vps.sh

# stop (keeps database volume)
docker compose --env-file .env.vps -f compose.vps.yml down
```

## Notes

This package is derived from Titan Zero Merge 74 installer-ready candidate. It builds from the included source rather than requiring placeholder GHCR images.
