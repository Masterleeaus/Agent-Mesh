# Workforce VPS service lifecycle

The VPS composition runs Titan Workforce as its own persistent `workforce`
service, separate from the web application and automation `worker`. Compose
uses the fixed `titan-zero` project name and an `unless-stopped` restart policy;
restarting the process does not start a second service container.

## Install and upgrade

Use the supported installer with the exact release ZIP. Before first install,
commission the identity registry and trusted public keys as described in the
[VPS installation guide](README-VPS.md). The installer validates those inputs,
builds the service images, runs migrations, and starts the stack. `/health`
confirms that the Workforce process started; `/ready` remains unavailable until
its canonical dependencies are commissioned.

For an upgrade, take and verify a backup first, then rerun the installer with
the new release ZIP:

```bash
sudo bash scripts/vps/backup-vps.sh
sudo bash scripts/vps/install-vps.sh --source /root/titan-zero.zip --app-domain app.example.com
```

The installer creates an immutable release, keeps the shared environment and
data directories, and updates the `current` symlink. Compose reconciles the
existing `titan-zero` project, so it does not create a parallel Workforce
service. The legacy in-place updater remains disabled.

## Remove only Workforce

Run the release's removal script:

```bash
sudo bash /opt/titan-zero/current/scripts/vps/remove-workforce-service.sh
```

The command stops and removes only the Compose `workforce` container. It does
not stop the web, automation worker, or Redis services, and does not remove
images, named or anonymous volumes, runtime databases, company stores, identity
registry, keys, environment, or uploads. Repeating the command succeeds after
the container is already absent. It fails closed if the active release's
Compose file or shared environment is missing.

This is a service removal, not a full host uninstall. Rerunning the supported
installer will recreate Workforce from the release configuration. To remove
other services or shared state, use a separately reviewed host retirement
procedure with verified backups.
